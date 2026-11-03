import webpush from 'web-push';

// Server-side Web Push (free). Env (Vercel): NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
let ready = null;
function init() {
  if (ready !== null) return ready;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) { ready = false; return ready; }
  try { webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', pub, priv); ready = true; } catch (e) { ready = false; }
  return ready;
}

// Kabhi throw nahi karta (rating / call tracking kabhi nahi rukni chahiye).
export async function notifyProvider(admin, userId, { title, body, url = '/provider/dashboard', tag }) {
  try {
    if (!userId || !init()) return 0;
    const { data: subs } = await admin.from('provider_push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId);
    if (!subs || subs.length === 0) return 0;
    const payload = JSON.stringify({ title: String(title).slice(0, 120), body: String(body || '').slice(0, 240), url, tag });
    const dead = [];
    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: 'normal' });
        sent += 1;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.id);
      }
    }));
    if (dead.length) await admin.from('provider_push_subscriptions').delete().in('id', dead);
    return sent;
  } catch (e) { return 0; }
}
