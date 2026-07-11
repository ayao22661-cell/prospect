function greeting(name) {
  return name && name.trim() ? `Bonjour ${name.trim()},` : "Bonjour,";
}

export function getInvestorEmail({ name, replyTo }) {
  const subject = "Kweni Studio — studio de jeux/apps basé à Abidjan, présentation rapide";
  const html = `
    <p>${greeting(name)}</p>
    <p>Je m'appelle Yao Baba, je dirige <strong>Kweni Studio</strong>, un studio basé à Abidjan qui développe
    des jeux et applications pensés pour le marché africain et sa diaspora.</p>
    <p>Deux projets en particulier avancent bien en ce moment :</p>
    <ul>
      <li><strong>BuzzKing</strong> — simulation de carrière rap multilingue (FR/UK/US/BR/NG/DE), en phase de test fermé avant sortie sur Google Play.</li>
      <li><strong>Pensée IA</strong> — assistant IA multi-agents (recherche web, mémoire, génération de fichiers).</li>
    </ul>
    <p>Je serais ravi d'échanger 15-20 minutes pour vous présenter la traction actuelle et la feuille de route,
    si le sujet vous intéresse.</p>
    <p>Bien à vous,<br/>Yao Baba<br/>Kweni Studio<br/><a href="https://kwenistudio.vercel.app">kwenistudio.vercel.app</a> · <a href="https://www.linkedin.com/in/yao-babaange-emmanuel">LinkedIn</a></p>
    <hr style="margin-top:24px;border:none;border-top:1px solid #ddd" />
    <p style="font-size:12px;color:#777">
      Vous recevez cet email car vos coordonnées sont publiées publiquement sur ${"{{source_label}}"}.
      Pour ne plus recevoir de message de ma part, répondez simplement "STOP" à cet email ou écrivez à
      <a href="mailto:${replyTo}">${replyTo}</a>.
    </p>
  `;
  return { subject, html };
}

export function getTesterEmail({ name, replyTo }) {
  const subject = "Recherche de testeurs — BuzzKing (jeu mobile, Kweni Studio)";
  const html = `
    <p>${greeting(name)}</p>
    <p>Je développe <strong>BuzzKing</strong>, un jeu mobile de simulation de carrière rap
    (gratuit, multilingue) sur le point de sortir sur Google Play, et je recherche des testeurs
    pour la phase de test fermé.</p>
    <p>Ce que ça implique : installer l'app, jouer quelques sessions, remonter vos retours.
    Ça prend peu de temps et ça aide beaucoup au lancement.</p>
    <p>Intéressé(e) ? Répondez simplement à cet email et je vous envoie l'accès.</p>
    <p>Merci,<br/>Yao Baba<br/>Kweni Studio<br/><a href="https://kwenistudio.vercel.app">kwenistudio.vercel.app</a> · <a href="https://www.linkedin.com/in/yao-babaange-emmanuel">LinkedIn</a></p>
    <hr style="margin-top:24px;border:none;border-top:1px solid #ddd" />
    <p style="font-size:12px;color:#777">
      Vous recevez cet email car vos coordonnées sont publiées publiquement sur ${"{{source_label}}"}.
      Pour ne plus recevoir de message de ma part, répondez simplement "STOP" à cet email ou écrivez à
      <a href="mailto:${replyTo}">${replyTo}</a>.
    </p>
  `;
  return { subject, html };
}

export function getMediaEmail({ name, replyTo }) {
  const subject = "Kweni Studio (Abidjan) — une piste d'article sur le gaming africain";
  const html = `
    <p>${greeting(name)}</p>
    <p>Je m'appelle Yao Baba, je dirige <strong>Kweni Studio</strong>, un studio basé à Abidjan qui développe
    des jeux et des applications pensés pour le marché africain et sa diaspora.</p>
    <p>Je ne vous écris pas pour un communiqué classique, mais parce qu'on est en plein lancement de
    <strong>BuzzKing</strong>, une simulation de carrière rap disponible en français, anglais, portugais et
    allemand, pensée depuis Abidjan pour une audience mondiale — un angle qui pourrait intéresser vos lecteurs
    sur le développement de jeux vidéo made in Africa.</p>
    <p>Si le sujet vous parle, je peux vous envoyer un dossier de presse court (contexte, captures, accès test)
    ou répondre directement à vos questions.</p>
    <p>Bien à vous,<br/>Yao Baba<br/>Kweni Studio<br/><a href="https://kwenistudio.vercel.app">kwenistudio.vercel.app</a> · <a href="https://www.linkedin.com/in/yao-babaange-emmanuel">LinkedIn</a></p>
    <hr style="margin-top:24px;border:none;border-top:1px solid #ddd" />
    <p style="font-size:12px;color:#777">
      Vous recevez cet email car vos coordonnées sont publiées publiquement sur ${"{{source_label}}"}.
      Pour ne plus recevoir de message de ma part, répondez simplement "STOP" à cet email ou écrivez à
      <a href="mailto:${replyTo}">${replyTo}</a>.
    </p>
  `;
  return { subject, html };
}

export function getGeneralEmail({ name, replyTo }) {
  const subject = "Kweni Studio (Abidjan) — jeux, IA et récits africains";
  const html = `
    <p>${greeting(name)}</p>
    <p>Je m'appelle Yao Baba, je dirige <strong>Kweni Studio</strong>, un studio basé à Abidjan qui développe
    des jeux vidéo et des outils IA pensés depuis l'Afrique pour une audience mondiale — dont
    <strong>BuzzKing</strong>, une simulation de carrière rap multilingue, et <strong>Pensée IA</strong>,
    un assistant IA multi-agents.</p>
    <p>Je vous contacte parce que votre profil/activité recoupe ce qu'on construit, et qu'un échange
    pourrait avoir du sens — que ce soit une collaboration, un partenariat, ou simplement un retour sur
    ce qu'on fait.</p>
    <p>Si le sujet vous intéresse, répondez simplement à cet email.</p>
    <p>Bien à vous,<br/>Yao Baba<br/>Kweni Studio<br/><a href="https://kwenistudio.vercel.app">kwenistudio.vercel.app</a> · <a href="https://www.linkedin.com/in/yao-babaange-emmanuel">LinkedIn</a></p>
    <hr style="margin-top:24px;border:none;border-top:1px solid #ddd" />
    <p style="font-size:12px;color:#777">
      Vous recevez cet email car vos coordonnées sont publiées publiquement sur ${"{{source_label}}"}.
      Pour ne plus recevoir de message de ma part, répondez simplement "STOP" à cet email ou écrivez à
      <a href="mailto:${replyTo}">${replyTo}</a>.
    </p>
  `;
  return { subject, html };
}

export function getEmailFor(type, params) {
  if (type === "investor") return getInvestorEmail(params);
  if (type === "media") return getMediaEmail(params);
  if (type === "tester") return getTesterEmail(params);
  return getGeneralEmail(params);
}
