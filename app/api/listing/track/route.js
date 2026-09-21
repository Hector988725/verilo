import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

const ALLOWED_TYPES = ['view', 'call', 'whatsapp'];

export async function POST(req) {
  try {
    const { listing_id, event_type } = await req.json();
    if (!listing_id || !ALLOWED_TYPES.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const admin = supabaseAdmin();
    // Fire-and-forget from the caller's point of view — errors here shouldn't
    // ever block the visitor's call/WhatsApp action, so we just log and 200.
    const { error } = await admin.from('listing_events').insert({ listing_id, event_type });
    if (error) console.error('[track] insert failed:', error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[track] Failed:', err);
    return NextResponse.json({ success: true });
  }
}
