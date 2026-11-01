// Dukaan Order System ki opt-in shops (sirf padhna). Dukaan ke Supabase ke 2 public views se:
//   verilo_shops          -> opt-in + active subscription + non-test shops
//   verilo_shop_products  -> unke available aur stock wale products
// Sirf Dukaan ki public anon key chalti hai (koi secret nahi). Env set nahi to feature band: khali list.
import { cleanCityName, cleanState } from './cities';

const DEFAULT_STOREFRONT = 'https://dukaan-order-system.vercel.app';
const SHOP_LIMIT = 30;
const PRODUCT_LIMIT = 2000;
const PRODUCTS_PER_SHOP = 40;
const CATEGORIES_PER_SHOP = 6;
const TIMEOUT_MS = 4000;

const SHOP_COLS = 'store_id,slug,name,business_type,tagline,logo_url,address,city,state,pincode,maps_link,whatsapp_number,timings';
const PRODUCT_COLS = 'product_id,store_id,name,category,brand,price_from';

// Dukaan me city sirf akshar, space . ' - ho sakti hai; baaki kuch ho to Dukaan me match hoga hi nahi.
const DUKAAN_CITY_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,59}$/u;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/i;

function httpsOnly(u) {
  const s = String(u || '').trim();
  return /^https:\/\/[^\s]+$/i.test(s) ? s : null;
}

function cleanPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export function normalizeShops(shopRows, productRows, storefront = DEFAULT_STOREFRONT) {
  const base = String(storefront || DEFAULT_STOREFRONT).replace(/\/+$/, '');
  const byStore = new Map();
  for (const p of productRows || []) {
    if (!p || !UUID_RE.test(String(p.store_id))) continue;
    if (!byStore.has(p.store_id)) byStore.set(p.store_id, []);
    byStore.get(p.store_id).push(p);
  }

  const out = [];
  for (const s of shopRows || []) {
    if (!s || !UUID_RE.test(String(s.store_id)) || !SLUG_RE.test(String(s.slug || ''))) continue;
    const prods = byStore.get(s.store_id) || [];

    const catCount = new Map();
    for (const p of prods) {
      const c = String(p.category || '').trim();
      if (c) catCount.set(c, (catCount.get(c) || 0) + 1);
    }
    const categories = [...catCount.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, CATEGORIES_PER_SHOP)
      .map(([name, count]) => ({ name, count }));

    const price = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));
    const products = prods.slice(0, PRODUCTS_PER_SHOP).map((p) => ({
      n: String(p.name || ''),
      c: String(p.category || ''),
      b: p.brand ? String(p.brand) : '',
      p: price(p.price_from),
    }));

    const wa = cleanPhone(s.whatsapp_number);
    out.push({
      store_id: s.store_id,
      slug: s.slug,
      name: String(s.name || '').slice(0, 120),
      business_type: s.business_type ? String(s.business_type).slice(0, 40) : '',
      tagline: s.tagline ? String(s.tagline).slice(0, 160) : '',
      logo_url: httpsOnly(s.logo_url),
      address: s.address ? String(s.address).slice(0, 200) : '',
      city: s.city || '',
      state: s.state || '',
      pincode: s.pincode || '',
      maps_url: httpsOnly(s.maps_link),
      whatsapp: wa,
      timings: s.timings ? String(s.timings).slice(0, 120) : '',
      order_url: `${base}/${encodeURIComponent(s.slug)}`,
      categories,
      products,
      product_count: prods.length,
    });
  }
  return out;
}

async function getJson(url, key, fetchImpl) {
  const res = await fetchImpl(url, {
    // Nayi sb_publishable_ key JWT nahi hoti: use Bearer me nahi bhej sakte (sirf apikey). Purani eyJ... key dono me.
    headers: /^eyJ/.test(key) ? { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } : { apikey: key, Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Cache nahi: dukaandar ne Verilo OFF kiya to dukaan turant hatni chahiye. Taaza jawab ek hi jagah se thama jata hai
    // (api/shops ka s-maxage=30), yahan alag se purana jawab rok kar rakhne se OFF dukaan 5+ minute dikhti rehti thi.
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`dukaan ${res.status}`);
  return res.json();
}

const PIN_RE = /^[1-9]\d{5}$/;

// Kabhi throw nahi karta: kuch bhi gadbad ho to { shops: [], ok: false } (Verilo ka baaki page chalta rahe).
// pin (6 digit) diya ho to us pincode ki shops bhi judti hain, chahe Dukaan me city ka spelling alag ho.
export async function fetchDukaanShops({ city, state, pin }, env = process.env, fetchImpl = fetch) {
  // URL me galti se /rest/v1 (ya spaces) paste ho gaya ho to bhi chale
  const url = String(env.DUKAAN_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
  const key = String(env.DUKAAN_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return { shops: [], ok: false, reason: 'not_configured' };

  const cityName = cleanCityName(city);
  const cityOk = !!cityName && DUKAAN_CITY_RE.test(cityName);
  const pinOk = PIN_RE.test(String(pin || ''));
  if (!cityOk && !pinOk) return { shops: [], ok: true };
  const st = cleanState(state);
  if (st === undefined && !pinOk) return { shops: [], ok: true };

  try {
    const jobs = [];
    if (cityOk && st !== undefined) {
      const q = new URLSearchParams({ select: SHOP_COLS, city: `ilike.${cityName}`, order: 'name.asc', limit: String(SHOP_LIMIT) });
      if (st) q.set('state', `eq.${st}`);
      jobs.push(getJson(`${url}/rest/v1/verilo_shops?${q}`, key, fetchImpl).then((rows) =>
        // ilike me _ aur % wildcard hote hain; exact (case-insensitive) match hi rakhein
        (Array.isArray(rows) ? rows : []).filter((r) => String(r.city || '').trim().toLowerCase() === cityName.toLowerCase())
      ));
    }
    if (pinOk) {
      const q = new URLSearchParams({ select: SHOP_COLS, pincode: `eq.${pin}`, order: 'name.asc', limit: String(SHOP_LIMIT) });
      jobs.push(getJson(`${url}/rest/v1/verilo_shops?${q}`, key, fetchImpl).then((rows) => (Array.isArray(rows) ? rows : [])));
    }
    const lists = await Promise.all(jobs);
    const seen = new Set();
    const shopRows = [];
    for (const r of lists.flat()) {
      if (!r || seen.has(r.store_id)) continue;
      seen.add(r.store_id);
      shopRows.push(r);
    }
    if (shopRows.length === 0) return { shops: [], ok: true };

    const ids = shopRows.map((r) => r.store_id).filter((id) => UUID_RE.test(String(id)));
    let productRows = [];
    if (ids.length) {
      const pq = new URLSearchParams({ select: PRODUCT_COLS, store_id: `in.(${ids.join(',')})`, order: 'name.asc', limit: String(PRODUCT_LIMIT) });
      const pr = await getJson(`${url}/rest/v1/verilo_shop_products?${pq}`, key, fetchImpl);
      productRows = Array.isArray(pr) ? pr : [];
    }
    return { shops: normalizeShops(shopRows, productRows, env.DUKAAN_STOREFRONT_URL), ok: true };
  } catch (e) {
    console.error('dukaan shops fetch failed:', e && e.message);
    return { shops: [], ok: false, reason: 'fetch_failed' };
  }
}

// Pincode -> { city, state } (Dukaan ki opt-in shop se). Kuch na mile to null.
export async function lookupPincodeInDukaan(pin, env = process.env, fetchImpl = fetch) {
  const url = String(env.DUKAAN_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
  const key = String(env.DUKAAN_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key || !PIN_RE.test(String(pin || ''))) return null;
  try {
    const q = new URLSearchParams({ select: 'city,state', pincode: `eq.${pin}`, limit: '1' });
    const rows = await getJson(`${url}/rest/v1/verilo_shops?${q}`, key, fetchImpl);
    const r = Array.isArray(rows) ? rows[0] : null;
    const c = r && cleanCityName(r.city);
    return c ? { city: c, state: cleanState(r.state) || '' } : null;
  } catch { return null; }
}
