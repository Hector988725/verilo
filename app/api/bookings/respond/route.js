import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { verifyOwnerToken } from '../../../../lib/verifyOwnerToken';

const ALLOWED = ['accepted', 'rejected', 'completed'];

export async function POST(req) {
  try {
    const { listing_id, token, booking_id, status } = await req.json();
    if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const admin = supabaseAdmin();
    const ok = await verifyOwnerToken(admin, listing_id, token);
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Extra safety: only update a booking that actually belongs to this listing,
    // so a valid token for listing A can never touch listing B's bookings.
    const { error } = await admin
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', booking_id)
      .eq('listing_id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
