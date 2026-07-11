import * as cheerio from "cheerio";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// "nom [at] domaine [dot] com" / "nom (at) domaine (dot) com" / "nom AT domaine DOT com" / "nom_at_domaine_dot_com"
const OBFUSCATED_REGEX =
  /([a-zA-Z0-9._%+-]+)\s*[\[\(_]?\s*(?:at|arobase)\s*[\]\)_]?\s*([a-zA-Z0-9.-]+)\s*[\[\(_]?\s*(?:dot|point)\s*[\]\)_]?\s*([a-zA-Z]{2,})/gi;

const IGNORE_EXT = /\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i;

function deobfuscate(text) {
  const found = new Set();
  let m;
  OBFUSCATED_REGEX.lastIndex = 0;
  while ((m = OBFUSCATED_REGEX.exec(text)) !== null) {
    const [, user, domain, tld] = m;
    found.add(`${user}@${domain}.${tld}`.toLowerCase());
  }
  return [...found];
}

// Cherche un nom plausible près d'un lien mailto (texte du lien, ou titre dans la carte parente)
function guessNameNear($, el) {
  const $el = $(el);
  const linkText = $el.text().trim();
  if (linkText && !linkText.includes("@") && linkText.length > 1 && linkText.length < 60) {
    return linkText;
  }
  const $parent = $el.closest("li, div, article, section, tr");
  if ($parent.length) {
    const heading = $parent.find("h1,h2,h3,h4,strong,b").first().text().trim();
    if (heading && heading.length < 60) return heading;
  }
  return "";
}

export function extractEmailsWithNames(html) {
  const $ = cheerio.load(html);
  const results = new Map(); // email -> name

  // 1) Liens mailto: (source la plus fiable, et on tente d'en extraire un nom)
  $("a[href^='mailto:']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const email = href.replace("mailto:", "").split("?")[0].trim().toLowerCase();
    if (!email) return;
    const name = guessNameNear($, el);
    if (!results.has(email) || (!results.get(email) && name)) results.set(email, name);
  });

  const bodyText = $("body").text();

  // 2) Emails en clair dans le texte
  (bodyText.match(EMAIL_REGEX) || []).forEach((m) => {
    const clean = m.toLowerCase();
    if (!IGNORE_EXT.test(clean) && !results.has(clean)) results.set(clean, "");
  });

  // 3) Emails obfusqués ("nom [at] domaine [dot] com") — courants sur les sites anti-scraping
  deobfuscate(bodyText).forEach((email) => {
    if (!results.has(email)) results.set(email, "");
  });

  return [...results.entries()].map(([email, name]) => ({ email, name }));
}
