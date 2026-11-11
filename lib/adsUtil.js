// Ads ke chhote helper (server aur browser dono me use hote hain, isliye pure functions).

export function digits(v) { return String(v || '').replace(/\D/g, ''); }

// India number -> 91XXXXXXXXXX
export function indiaNumber(v) {
  const d = digits(v);
  if (d.length === 10) return '91' + d;
  if (d.length === 12 && d.startsWith('91')) return d;
  if (d.length === 11 && d.startsWith('0')) return '91' + d.slice(1);
  return '';
}

// Ad par tap karne par kaha jana hai. Sirf safe links (https / wa.me / tel).
export function adHref(ad) {
  if (!ad) return '';
  const v = String(ad.link_value || '').trim();
  if (ad.link_type === 'whatsapp') { const n = indiaNumber(v); return n ? `https://wa.me/${n}` : ''; }
  if (ad.link_type === 'call') { const n = indiaNumber(v); return n ? `tel:+${n}` : ''; }
  if (ad.link_type === 'link') { return /^https:\/\/[^\s]+$/i.test(v) ? v : ''; }
  return '';
}

// cities khali = sab shehar; warna us shehar ka naam match (chhota-bada akshar fark nahi)
export function adMatchesCity(ad, city) {
  const list = Array.isArray(ad.cities) ? ad.cities : [];
  if (list.length === 0) return true;
  const c = String(city || '').trim().toLowerCase();
  return list.some((x) => String(x).trim().toLowerCase() === c);
}

// Aaj ki tareekh IST me (YYYY-MM-DD)
export function todayIST(now = Date.now()) {
  return new Date(now + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
