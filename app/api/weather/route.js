import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { mapSymbol, isDayIST } from '../../../lib/weather';

export const dynamic = 'force-dynamic';

// MET Norway ke niyam: apni app/site ki pehchaan wala User-Agent, aur server se cache karke bulana.
const UA = 'Hector365-Verilo/1.0 https://verilo.officialhector365.workers.dev';
const DEFAULT = { lat: 23.1, lon: 81.69 }; // Anuppur
const CORS = { 'Access-Control-Allow-Origin': '*' };

async function geocode(city, state) {
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('format', 'jsonv2');
  u.searchParams.set('limit', '1');
  u.searchParams.set('countrycodes', 'in');
  u.searchParams.set('city', city);
  if (state) u.searchParams.set('state', state);
  const res = await fetch(u.toString(), {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
    cf: { cacheTtl: 2592000, cacheEverything: true }, // shehar ki jagah 30 din yaad rakho
  });
  if (!res.ok) return null;
  const j = await res.json();
  if (!Array.isArray(j) || !j[0]) return null;
  const lat = Number(j[0].lat), lon = Number(j[0].lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

// GET /api/weather?city=Anuppur&state=Madhya%20Pradesh   (city na ho to visitor ki approximate location)
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const city = (q.get('city') || '').trim().slice(0, 60);
  const state = (q.get('state') || '').trim().slice(0, 40);
  let spot = null;
  try {
    if (city) spot = await geocode(city, state);
    if (!spot) {
      const cf = getCloudflareContext().cf || {};
      const lat = Number(cf.latitude), lon = Number(cf.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) spot = { lat, lon };
    }
  } catch (e) { /* neeche default */ }
  if (!spot) spot = DEFAULT;
  const lat = spot.lat.toFixed(2), lon = spot.lon.toFixed(2);

  try {
    const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      cf: { cacheTtl: 1800, cacheEverything: true }, // 30 min cache: har visitor par naya call nahi
    });
    if (!res.ok) throw new Error('met ' + res.status);
    const j = await res.json();
    const t0 = j.properties.timeseries[0];
    const d = t0.data;
    const symbol = (d.next_1_hours && d.next_1_hours.summary.symbol_code) || (d.next_6_hours && d.next_6_hours.summary.symbol_code) || 'clearsky_day';
    const out = mapSymbol(symbol, isDayIST());
    return NextResponse.json(
      { ...out, temp: d.instant && d.instant.details ? d.instant.details.air_temperature : null, symbol },
      { headers: { ...CORS, 'Cache-Control': 'public, max-age=600, s-maxage=900' } },
    );
  } catch (e) {
    return NextResponse.json({ error: 'weather unavailable' }, { status: 502, headers: CORS });
  }
}
