// Sends email via Brevo (HTTP API) — works on Cloudflare Workers (no SMTP sockets needed).
// Env: BREVO_API_KEY (Secret), EMAIL_FROM (verified sender address in Brevo), EMAIL_FROM_NAME (optional, default "Verilo")
export async function sendEmail({ to, subject, html }) {
  const key = process.env.BREVO_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.error('[email] BREVO_API_KEY / EMAIL_FROM not configured — skipping send.');
    return { error: 'Email not configured' };
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: process.env.EMAIL_FROM_NAME || 'Verilo', email: from },
        to: (Array.isArray(to) ? to : [to]).map((e) => ({ email: e })),
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.error('[email] Brevo send failed:', res.status, t);
      return { error: `Email send failed (${res.status})` };
    }
    return { success: true };
  } catch (err) {
    console.error('[email] Send failed:', err);
    return { error: err.message };
  }
}
