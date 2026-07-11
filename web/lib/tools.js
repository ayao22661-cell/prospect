import { getSupabaseServerClient } from "./supabase.js";
import { sendViaGmail, REPLY_TO_EMAIL } from "./gmailSender.js";
import { getEmailFor } from "./emailTemplates.js";

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || "30", 10);

export const toolDeclarations = [
  {
    name: "list_prospects",
    description: "Liste les prospects, filtrable par statut et/ou type.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "new | sent | failed | unsubscribed (optionnel)" },
        type: { type: "string", description: "investor | tester | media | general (optionnel)" },
        limit: { type: "number", description: "nombre max de résultats, défaut 50" },
      },
    },
  },
  {
    name: "get_stats",
    description: "Retourne le nombre de prospects par statut et par type, plus le nombre d'emails envoyés sur les dernières 24h.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "send_email",
    description: "Envoie un email de prospection à un contact précis, via Gmail. Refuse si la limite quotidienne est atteinte, si le contact est déjà 'sent' ou 'unsubscribed'.",
    parameters: {
      type: "object",
      properties: { email: { type: "string", description: "adresse email du prospect à contacter" } },
      required: ["email"],
    },
  },
  {
    name: "mark_status",
    description: "Change le statut d'un prospect (ex: 'unsubscribed' si un contact répond STOP).",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string" },
        status: { type: "string", description: "new | sent | failed | unsubscribed" },
      },
      required: ["email", "status"],
    },
  },
];

export async function executeTool(name, args) {
  const supabase = getSupabaseServerClient();

  if (name === "list_prospects") {
    let query = supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(args.limit || 50);
    if (args.status) query = query.eq("status", args.status);
    if (args.type) query = query.eq("type", args.type);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { prospects: data };
  }

  if (name === "get_stats") {
    const { data: prospects } = await supabase.from("prospects").select("status, type");
    const byStatus = {};
    const byType = {};
    for (const p of prospects || []) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byType[p.type] = (byType[p.type] || 0) + 1;
    }
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: sentLast24h } = await supabase
      .from("sent_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", since);
    return { byStatus, byType, sentLast24h: sentLast24h || 0, dailyLimit: DAILY_LIMIT };
  }

  if (name === "send_email") {
    const email = (args.email || "").toLowerCase().trim();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: sentLast24h } = await supabase
      .from("sent_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", since);
    if ((sentLast24h || 0) >= DAILY_LIMIT) {
      return { error: `Limite quotidienne atteinte (${DAILY_LIMIT}/24h). Réessaie plus tard.` };
    }

    const { data: prospect } = await supabase.from("prospects").select("*").eq("email", email).single();
    if (!prospect) return { error: `Prospect introuvable : ${email}` };
    if (prospect.status === "unsubscribed") return { error: `${email} s'est désinscrit, envoi bloqué.` };
    if (prospect.status === "sent") return { error: `${email} a déjà reçu un email, envoi bloqué.` };

    const { subject, html } = getEmailFor(prospect.type, { name: prospect.name, replyTo: REPLY_TO_EMAIL });
    const finalHtml = html.replace(/\{\{source_label\}\}/g, prospect.label || "une source publique");

    try {
      await sendViaGmail({ to: email, subject, html: finalHtml });
      await supabase.from("prospects").update({ status: "sent", updated_at: new Date().toISOString() }).eq("email", email);
      await supabase.from("sent_log").insert({
        prospect_id: prospect.id,
        email,
        type: prospect.type,
        status: "sent",
        channel: "chat",
      });
      return { ok: true, sentTo: email };
    } catch (err) {
      await supabase.from("prospects").update({ status: "failed", updated_at: new Date().toISOString() }).eq("email", email);
      await supabase.from("sent_log").insert({
        prospect_id: prospect.id,
        email,
        type: prospect.type,
        status: "failed",
        error: err.message,
        channel: "chat",
      });
      return { error: `Échec de l'envoi à ${email} : ${err.message}` };
    }
  }

  if (name === "mark_status") {
    const email = (args.email || "").toLowerCase().trim();
    const { error } = await supabase
      .from("prospects")
      .update({ status: args.status, updated_at: new Date().toISOString() })
      .eq("email", email);
    if (error) return { error: error.message };
    return { ok: true, email, status: args.status };
  }

  return { error: `Outil inconnu : ${name}` };
}
