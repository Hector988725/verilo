import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { verifyOwnerToken } from '../../../../lib/verifyOwnerToken';

// Bridges the old "private link saved in this browser" system into a real
// account: if this browser already has a valid manage_token for a listing
// (from before providers could log in), signing in links that listing to
// the new account — so it shows up in the dashboard from any device from
// then on. The manage_token itself is the proof of ownership here, exactly
// as it is for every other listing-management action.
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const accessToken = authHeader.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { listing_id, token } = await req.json();
    const admin = supabaseAdmin();

    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const ok = await verifyOwnerToken(admin, listing_id, token);
    if (!ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // CRITICAL: only claim a listing that has no owner yet. Without this
    // check, any account signing in on a browser that still has an old
    // cached manage_token (e.g. a shared/testing device) could silently
    // steal ownership of someone else's already-claimed listing.
    const { data: listing } = await admin.from('listings').select('owner_id').eq('id', listing_id).single();
    if (listing?.owner_id && listing.owner_id !== userData.user.id) {
      return NextResponse.json({ error: 'This listing already belongs to another account' }, { status: 403 });
    }
    if (listing?.owner_id === userData.user.id) {
      return NextResponse.json({ success: true }); // already theirs, nothing to do
    }

    await admin.from('listings').update({ owner_id: userData.user.id }).eq('id', listing_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
