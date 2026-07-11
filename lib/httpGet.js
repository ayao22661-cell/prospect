import axios from "axios";
import { isAllowed } from "./robots.js";

const HEADERS = {
  "User-Agent": "KweniStudioProspectBot/1.0 (+contact: kweni.studio.contact@gmail.com)",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET poli : vérifie robots.txt avant de partir, réessaie jusqu'à `retries` fois
 * avec un backoff exponentiel (1s, 2s, 4s...) en cas d'erreur réseau/timeout.
 * Retourne { html } | { skipped: true, reason } | { error }
 */
export async function politeGet(url, { retries = 3, timeout = 10000 } = {}) {
  const allowed = await isAllowed(url);
  if (!allowed) {
    return { skipped: true, reason: "disallowed by robots.txt" };
  }

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout });
      return { html: data };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await delay(1000 * 2 ** (attempt - 1));
    }
  }
  return { error: lastErr?.message || "erreur inconnue" };
}
