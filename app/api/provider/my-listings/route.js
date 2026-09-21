import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const accessToken = authHeader.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { data, error } = await admin
      .from('listings')
      .select('id, name, service, phone, is_active, manage_token, trial_ends_at, is_autopay, photo_url, city_id, cities(name, state)')
      .eq('owner_id', userData.user.id)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const listings = data || [];

    // Attach lightweight analytics — total views, call clicks, and WhatsApp
    // clicks per listing — so the provider can see the value of staying active.
    const ids = listings.map((l) => l.id);
    if (ids.length) {
      const { data: events } = await admin.from('listing_events').select('listing_id, event_type').in('listing_id', ids);
      const counts = {};
      (events || []).forEach((e) => {
        counts[e.listing_id] = counts[e.listing_id] || { view: 0, call: 0, whatsapp: 0 };
        counts[e.listing_id][e.event_type] = (counts[e.listing_id][e.event_type] || 0) + 1;
      });
      listings.forEach((l) => { l.stats = counts[l.id] || { view: 0, call: 0, whatsapp: 0 }; });
    }

    return NextResponse.json({ listings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
