import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { rateLimited, clientIp } from '../../../../lib/rateLimit';

const TYPES = ['view', 'click', 'unmute'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ad ki gintee (view / click / awaaz chalu). Kabhi visitor ko rokta nahi: hamesha 200.
export async function POST(req) {
  try {
    const { ad_id, event_type, city } = await req.json();
    if (!UUID.test(String(ad_id || '')) || !TYPES.includes(event_type)) return NextResponse.json({ ok: true });
    const admin = supabaseAdmin();
    if (await rateLimited(admin, `ad:${clientIp(req)}:${ad_id}:${event_type}`, 12, 3600)) return NextResponse.json({ ok: true });
    await admin.from('ad_events').insert({ ad_id, event_type, city: String(city || '').slice(0, 80) || null });
  } catch (e) {
    console.error('[ads/event] failed', e);
  }
  return NextResponse.json({ ok: true });
}
