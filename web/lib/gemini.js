import { toolDeclarations, executeTool } from "./tools.js";

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemma-3-27b-it";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `Tu es l'assistant de prospection de Yao Baba (Kweni Studio, Abidjan).
Tu pilotes l'envoi d'emails de prospection (investisseurs, testeurs, médias) via les outils
disponibles. Réponds en français, de façon directe et concise.

Règles importantes :
- Ne fais jamais d'action irréversible (send_email, mark_status) sans que la demande de Baba
  soit claire sur QUI est concerné (un contact précis, ou un critère explicite comme "tous les
  nouveaux prospects investisseurs").
- Pour un envoi en masse ("envoie à tous les X"), utilise d'abord list_prospects pour récupérer
  la liste, puis appelle send_email pour chacun un par un. Si la liste est longue, dis combien
  ont été envoyés et combien restent, plutôt que de tout tenter d'un coup.
- Si send_email renvoie une erreur de limite quotidienne, arrête-toi et préviens Baba au lieu
  d'insister.
- Après une action, résume clairement ce qui a été fait (combien d'emails envoyés, à qui, et
  les échecs éventuels).`;

function toGeminiHistory(history) {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

async function callGemini(contents) {
  const res = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      tools: [{ functionDeclarations: toolDeclarations }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API a répondu ${res.status}`);
  }
  return data;
}

// Boucle : envoie le message, exécute les éventuels function calls, renvoie le résultat au
// modèle, jusqu'à obtenir une réponse texte finale (ou d'atteindre MAX_STEPS par sécurité).
export async function runChat(history, userMessage) {
  if (!API_KEY) throw new Error("GOOGLE_API_KEY manquant dans les variables d'environnement");

  const contents = [...toGeminiHistory(history), { role: "user", parts: [{ text: userMessage }] }];
  const actions = [];
  const MAX_STEPS = 6;

  for (let step = 0; step < MAX_STEPS; step++) {
    const data = await callGemini(contents);
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      const text = parts.map((p) => p.text || "").join("").trim();
      return { text: text || "(pas de réponse)", actions };
    }

    contents.push({ role: "model", parts });

    const responseParts = [];
    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      const result = await executeTool(name, args);
      actions.push({ tool: name, args, result });
      responseParts.push({ functionResponse: { name, response: result } });
    }
    contents.push({ role: "function", parts: responseParts });
  }

  return {
    text: "J'ai atteint la limite d'étapes pour cette action, dis-moi si tu veux que je continue.",
    actions,
  };
}
