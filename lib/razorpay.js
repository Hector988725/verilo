// Tiny Razorpay REST client (fetch + Basic auth) — replaces the `razorpay` npm SDK,
// which does not run on Cloudflare Workers. Same call shapes the app already uses.
// Errors are thrown as { statusCode, error: { code, description } } like the SDK did,
// so existing `err?.error?.description` handling keeps working.
const BASE = 'https://api.razorpay.com/v1';

async function rzp(method, path, body) {
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw { statusCode: 500, error: { description: 'Razorpay keys not configured' } };
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: 'Basic ' + btoa(`${id}:${secret}`),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw { statusCode: res.status, error: json.error || { description: `Razorpay HTTP ${res.status}` } };
  return json;
}

export const razorpay = {
  orders: {
    create: (params) => rzp('POST', '/orders', params),
    fetch: (id) => rzp('GET', `/orders/${encodeURIComponent(id)}`),
  },
  subscriptions: {
    create: (params) => rzp('POST', '/subscriptions', params),
    // SDK signature: cancel(id, cancelAtCycleEnd)
    cancel: (id, cancelAtCycleEnd = false) =>
      rzp('POST', `/subscriptions/${encodeURIComponent(id)}/cancel`, { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
  },
};
