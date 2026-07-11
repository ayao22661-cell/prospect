import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase.js";
import { sendViaGmail } from "../../../../lib/gmailSender.js";
import { getEmailFor } from "../../../../lib/emailTemplates.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // secondes

// Vercel Cron appelle cette route chaque jour (voir vercel.json). Elle :
// 1) récupère les prospects "new" dans Supabase (pas de fichier local, tout est en base)
// 2) envoie un email à chacun via Gmail, dans la limite DAILY_LIMIT
// 3) met à jour le statut du prospect + insère une ligne dans sent_log
//
// Contrairement à src/sendEmails.js (script local), cette route ne touche aucun fichier
// disque : l'état "qui a déjà reçu un email" vit uniquement dans la colonne prospects.status.

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || "30", 10);
const SEND_DELAY_MS = parseInt(process.env.SEND_DELAY_MS || "3000", 10); // plus court que le script local, borné par maxDuration

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const { data: prospects, error: fetchError } = await supabase
    .from("prospects")
    .select("*")
    .eq("status", "new")
    .limit(DAILY_LIMIT);

  if (fetchError) {
    await supabase.from("cron_log").insert({
      status: "error",
      message: `send: ${fetchError.message}`,
    });
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const prospect of prospects || []) {
    try {
      const { subject, html } = getEmailFor(prospect.type, {
        name: prospect.name,
        replyTo: process.env.REPLY_TO_EMAIL,
      });
      const finalHtml = html.replace(/\{\{source_label\}\}/g, prospect.label || "une source publique");

      await sendViaGmail({ to: prospect.email, subject, html: finalHtml });

      await supabase.from("prospects").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", prospect.id);
      await supabase.from("sent_log").insert({
        prospect_id: prospect.id,
        email: prospect.email,
        type: prospect.type,
        status: "sent",
        channel: "cron",
      });
      sentCount++;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      await supabase.from("prospects").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", prospect.id);
      await supabase.from("sent_log").insert({
        prospect_id: prospect.id,
        email: prospect.email,
        type: prospect.type,
        status: "failed",
        error: msg,
        channel: "cron",
      });
      failedCount++;
    }
    await delay(SEND_DELAY_MS);
  }

  await supabase.from("cron_log").insert({
    status: "success",
    new_sources: 0,
    new_prospects: 0,
    message: `send: ${sentCount} envoyé(s), ${failedCount} échec(s)`,
  });

  return NextResponse.json({ ok: true, sent: sentCount, failed: failedCount });
}
