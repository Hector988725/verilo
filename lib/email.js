import nodemailer from 'nodemailer';

// Sends email via Gmail SMTP using a Gmail account + App Password (not the
// normal Gmail password — generated in Google Account -> Security -> App
// Passwords, with 2-Step Verification turned on). Free, no domain needed.
// GMAIL_USER = the sending Gmail address, GMAIL_APP_PASSWORD = the 16-char app password.
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[email] GMAIL_USER / GMAIL_APP_PASSWORD not configured — skipping send.');
    return { error: 'Email not configured' };
  }
  try {
    await getTransporter().sendMail({
      from: `Verilo <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('[email] Send failed:', err);
    return { error: err.message };
  }
}
