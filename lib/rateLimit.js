// Chhota DB-based rate limiter (table: rate_limits, sirf service role). Serverless par memory
// share nahi hoti, isliye DB use hota hai. Fail-closed: DB error par "limited" maana jaata hai.

export function clientIp(req) {
  const xf = req.headers.get('x-forwarded-for') || '';
  return xf.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

// true = limit cross ho gayi (request rok do). false = theek hai (aur ye hit ginti mein jod di gayi).
export async function rateLimited(admin, key, max, windowSec) {
  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const { count, error } = await admin
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', since);
  if (error) return true;
  if ((count || 0) >= max) return true;
  const { error: insErr } = await admin.from('rate_limits').insert({ key });
  if (insErr) return true;
  if (Math.random() < 0.02) {
    const old = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
    await admin.from('rate_limits').delete().lt('created_at', old);
  }
  return false;
}
