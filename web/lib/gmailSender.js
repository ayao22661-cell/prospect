import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || GMAIL_USER;

let transporter = null;

function getTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD manquants dans les variables d'environnement");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendViaGmail({ to, subject, html }) {
  const info = await getTransporter().sendMail({
    from: `"Yao Baba - Kweni Studio" <${GMAIL_USER}>`,
    to,
    replyTo: REPLY_TO_EMAIL,
    subject,
    html,
  });
  return { id: info.messageId };
}

export { REPLY_TO_EMAIL };
