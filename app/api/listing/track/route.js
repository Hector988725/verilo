import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { rateLimited } from '../../../../lib/rateLimit';
import { notifyProvider } from '../../../../lib/pushServer';

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

    // Call / WhatsApp par provider ko alert — par ek listing ke liye 15 minute me ek hi (spam nahi)
    if (!error && event_type !== 'view' && /^[0-9a-f-]{36}$/i.test(String(listing_id))) {
      const { data: l } = await admin.from('listings').select('owner_id').eq('id', listing_id).maybeSingle();
      if (l && l.owner_id && !(await rateLimited(admin, `push_ev:${listing_id}`, 1, 900))) {
        await notifyProvider(admin, l.owner_id, {
          title: event_type === 'call' ? '📞 Someone tapped Call' : '💬 Someone tapped WhatsApp', body: 'A customer is trying to reach you from your Verilo listing.', tag: 'ev-' + listing_id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[track] Failed:', err);
    return NextResponse.json({ success: true });
  }
}
