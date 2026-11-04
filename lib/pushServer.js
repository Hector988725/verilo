import { buildPushPayload } from '@block65/webcrypto-web-push';

// Server-side Web Push (free). Env (Vercel): NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
function vapid() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return null;
  return { subject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com', publicKey: pub, privateKey: priv };
}

// Kabhi throw nahi karta (rating / call tracking kabhi nahi rukni chahiye).
export async function notifyProvider(admin, userId, { title, body, url = '/provider/dashboard', tag }) {
  try {
    const v = vapid();
    if (!userId || !v) return 0;
    const { data: subs } = await admin.from('provider_push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId);
    if (!subs || subs.length === 0) return 0;
    const payload = JSON.stringify({ title: String(title).slice(0, 120), body: String(body || '').slice(0, 240), url, tag });
    const dead = [];
    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        const req = await buildPushPayload(
          { data: payload, options: { ttl: 6 * 3600, urgency: 'normal' } },
          { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
          v
        );
        const res = await fetch(s.endpoint, req);
        if (res.status === 404 || res.status === 410) dead.push(s.id);
        else if (res.ok) sent += 1;
      } catch (e) { /* ignore single-subscription failure */ }
    }));
    if (dead.length) await admin.from('provider_push_subscriptions').delete().in('id', dead);
    return sent;
  } catch (e) { return 0; }
}
