import { NextResponse } from 'next/server';
import { lookupPincodeInDukaan } from '../../../lib/dukaanShops';
import { INDIAN_STATES } from '../../../lib/indianStates';

export const dynamic = 'force-dynamic';

const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
function matchState(name) {
  const n = norm(name);
  return INDIAN_STATES.find((s) => norm(s) === n) || '';
}

// GET /api/pincode?pin=484224  ->  { city: 'Anuppur', state: 'Madhya Pradesh' }
// Pehle Dukaan ki shops se (apna data), phir India Post ke public lookup se. Kuch na mile to 404.
export async function GET(req) {
  const pin = new URL(req.url).searchParams.get('pin') || '';
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ error: 'Enter a valid 6-digit PIN code' }, { status: 400 });
  const cache = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' };

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4500), cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      const po = j && j[0] && j[0].Status === 'Success' && Array.isArray(j[0].PostOffice) ? j[0].PostOffice[0] : null;
      if (po && po.District) {
        return NextResponse.json({ city: String(po.District).replace(/\s*District$/i, '').trim(), state: matchState(po.State) }, { headers: cache });
      }
    }
  } catch (e) { /* neeche Dukaan se try */ }

  const d = await lookupPincodeInDukaan(pin);
  if (d) return NextResponse.json(d, { headers: cache });
  return NextResponse.json({ error: 'PIN code not found. Please pick your state and district instead.' }, { status: 404 });
}
