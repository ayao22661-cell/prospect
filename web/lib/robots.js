import robotsParser from "robots-parser";
import axios from "axios";

// Cache par domaine pour ne télécharger robots.txt qu'une seule fois par run
const cache = new Map(); // origin -> robots instance | null

async function getRobots(origin) {
  if (cache.has(origin)) return cache.get(origin);
  try {
    const { data } = await axios.get(`${origin}/robots.txt`, { timeout: 6000 });
    const robots = robotsParser(`${origin}/robots.txt`, data);
    cache.set(origin, robots);
    return robots;
  } catch {
    // Pas de robots.txt ou inaccessible -> on considère l'accès autorisé
    cache.set(origin, null);
    return null;
  }
}

export async function isAllowed(url, userAgent = "KweniStudioProspectBot") {
  try {
    const origin = new URL(url).origin;
    const robots = await getRobots(origin);
    if (!robots) return true;
    return robots.isAllowed(url, userAgent) !== false;
  } catch {
    // URL invalide : on laisse le vrai fetch échouer plus loin avec une erreur claire
    return true;
  }
}
