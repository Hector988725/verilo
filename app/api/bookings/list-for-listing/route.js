import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { verifyOwnerToken } from '../../../../lib/verifyOwnerToken';

// Providers have no login of their own — they reach this via their secret
// manage_token, same as every other listing-management action.
export async function POST(req) {
  try {
    const { listing_id, token } = await req.json();
    const admin = supabaseAdmin();

    const ok = await verifyOwnerToken(admin, listing_id, token);
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await admin
      .from('bookings')
      .select('id, customer_name, customer_phone, message, status, created_at')
      .eq('listing_id', listing_id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookings: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
