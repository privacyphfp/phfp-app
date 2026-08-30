import nodemailer from 'nodemailer';

// Reuses the same Gmail account configured as the Supabase Auth SMTP
// sender, via an App Password (not the normal Gmail password — see
// Google Account > Security > App Passwords). Used for the app's own
// notification emails (enrollment/payment/course alerts), separate from
// Supabase Auth's own confirmation/reset emails.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

// Never throws — a notification email failing to send shouldn't break
// the enrollment/offering/event action that triggered it. Returns
// { sent: boolean, error?: string } so callers can log if they want.
export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) return { sent: false, error: 'Gmail SMTP not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).' };
  if (!to) return { sent: false, error: 'No recipient.' };

  try {
    await t.sendMail({
      from: `PHFP App <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}
