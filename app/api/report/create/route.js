import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { clientIp, rateLimited } from '../../../../lib/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Report karne ke liye login nahi chahiye (shikayat aasaan rahe), par IP par limit hai.
// Migration 30 ke baad browser se reports table me seedha insert band.
export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    const b = await req.json();
    const listingId = String(b.listing_id || '');
    if (!UUID_RE.test(listingId)) return NextResponse.json({ error: 'Invalid listing' }, { status: 400 });

    const reason = String(b.reason || '').trim().replace(/\s+/g, ' ');
    if (reason.length < 5) return NextResponse.json({ error: 'Please describe the issue (at least a few words).' }, { status: 400 });
    if (reason.length > 500) return NextResponse.json({ error: 'Please keep it under 500 characters.' }, { status: 400 });

    const ip = clientIp(req);
    if (
      (await rateLimited(admin, `report_ip:${ip}`, 5, 3600)) ||
      (await rateLimited(admin, `report_ip_listing:${ip}:${listingId}`, 1, 86400))
    ) {
      return NextResponse.json({ error: 'Too many reports. Please try again later.' }, { status: 429 });
    }

    const { data: listing } = await admin.from('listings').select('id').eq('id', listingId).maybeSingle();
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const { error } = await admin.from('reports').insert({ listing_id: listingId, reason });
    if (error) return NextResponse.json({ error: 'Could not send your report. Please try again.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
