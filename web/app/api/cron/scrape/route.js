import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getSupabaseServerClient } from "../../../../lib/supabase.js";
import { politeGet } from "../../../../lib/httpGet.js";
import { extractEmailsWithNames } from "../../../../lib/emailExtract.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // secondes — le scraping de plusieurs sources peut prendre du temps

// Vercel Cron appelle cette route chaque jour (voir vercel.json). Elle enchaîne :
// 1) expand-sources : transforme les pages "annuaire" de source_lists en sources individuelles
// 2) scrape : visite chaque source et en extrait des emails
//
// Différence volontaire avec la version locale : PAS de rendu JS (Playwright) ici — trop
// lourd pour une fonction serverless Vercel (limite de taille/temps d'exécution). Les sites
// très "SPA" qui ont besoin de rendu JS restent à traiter en local avec `npm run scrape`.
//
// Aucun email n'est envoyé par cette route — uniquement découverte/scraping.

const FOLLOW_KEYWORDS = ["contact", "team", "equipe", "équipe", "about", "a-propos", "à-propos", "people"];
const MAX_LINKS_PER_LISTING = 60;
const MAX_SUBPAGES_PER_SOURCE = 5;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractCandidateLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links = new Set();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, base);
      if (abs.origin === base.origin && abs.href !== base.href) links.add(abs.href);
    } catch {
      /* lien invalide, ignoré */
    }
  });
  return [...links].slice(0, MAX_LINKS_PER_LISTING);
}

function findSubPageLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links = new Set();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const lower = href.toLowerCase();
    if (!FOLLOW_KEYWORDS.some((k) => lower.includes(k))) return;
    try {
      const abs = new URL(href, base);
      if (abs.origin === base.origin) links.add(abs.href);
    } catch {
      /* ignore */
    }
  });
  return [...links].slice(0, MAX_SUBPAGES_PER_SOURCE);
}

async function expandSources(supabase) {
  const { data: lists } = await supabase.from("source_lists").select("*");
  const { data: existingSources } = await supabase.from("sources").select("url");
  const known = new Set((existingSources || []).map((s) => s.url));

  const toInsert = [];
  for (const listing of lists || []) {
    const res = await politeGet(listing.url);
    if (res.skipped || res.error) continue;
    const links = extractCandidateLinks(res.html, listing.url);
    for (const url of links) {
      if (known.has(url)) continue;
      known.add(url);
      toInsert.push({ url, type: listing.type, label: listing.label });
    }
    await delay(500);
  }

  if (toInsert.length) {
    await supabase.from("sources").upsert(toInsert, { onConflict: "url", ignoreDuplicates: true });
  }
  return toInsert.length;
}

async function scrapeContacts(supabase) {
  const { data: sources } = await supabase.from("sources").select("*");
  const { data: existingProspects } = await supabase.from("prospects").select("email");
  const knownEmails = new Set((existingProspects || []).map((p) => p.email.toLowerCase()));

  const toInsert = [];
  for (const source of sources || []) {
    const res = await politeGet(source.url);
    if (res.skipped || res.error) continue;

    const found = extractEmailsWithNames(res.html);
    for (const { email, name } of found) {
      const key = email.toLowerCase();
      if (knownEmails.has(key)) continue;
      knownEmails.add(key);
      toInsert.push({
        email: key,
        name: name || null,
        source_url: source.url,
        label: source.label,
        type: source.type,
        status: "new",
      });
    }

    // Sous-pages contact/équipe, sans rendu JS
    const subLinks = findSubPageLinks(res.html, source.url);
    for (const subUrl of subLinks) {
      const subRes = await politeGet(subUrl);
      if (subRes.skipped || subRes.error) continue;
      const subFound = extractEmailsWithNames(subRes.html);
      for (const { email, name } of subFound) {
        const key = email.toLowerCase();
        if (knownEmails.has(key)) continue;
        knownEmails.add(key);
        toInsert.push({
          email: key,
          name: name || null,
          source_url: subUrl,
          label: source.label,
          type: source.type,
          status: "new",
        });
      }
      await delay(500);
    }
    await delay(500);
  }

  if (toInsert.length) {
    await supabase.from("prospects").upsert(toInsert, { onConflict: "email", ignoreDuplicates: true });
  }
  return toInsert.length;
}

export async function GET(request) {
  // Vercel signe les appels cron avec ce header ; en dev/local il est absent, donc on ne
  // bloque que si CRON_SECRET est défini ET ne correspond pas.
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  try {
    const newSources = await expandSources(supabase);
    const newProspects = await scrapeContacts(supabase);

    await supabase.from("cron_log").insert({
      status: "success",
      new_sources: newSources,
      new_prospects: newProspects,
      message: `${newSources} nouvelle(s) source(s), ${newProspects} nouveau(x) prospect(s)`,
    });

    return NextResponse.json({ ok: true, newSources, newProspects });
  } catch (err) {
    await supabase.from("cron_log").insert({
      status: "error",
      message: err.message,
    });
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
