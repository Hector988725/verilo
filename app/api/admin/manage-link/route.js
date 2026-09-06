import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { isAdminAuthenticated } from '../../../../lib/adminAuth';

// Used only from the owner's Due List dashboard, to help a verified
// professional recover their manage link over WhatsApp after human
// confirmation. Never exposed to the public listing/profile pages.
export async function POST(req) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { listing_id } = await req.json();
    const admin = supabaseAdmin();
    const { data } = await admin
      .from('listings')
      .select('manage_token, city_id, cities(name)')
      .eq('id', listing_id)
      .single();

    if (!data || !data.manage_token) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const cityName = data.cities?.name || '';
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://verilo-seven.vercel.app'}/city/${encodeURIComponent(cityName)}/${listing_id}/manage?t=${data.manage_token}`;

    return NextResponse.json({ link });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
