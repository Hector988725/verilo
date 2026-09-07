import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { verifyOwnerToken } from '../../../../lib/verifyOwnerToken';

export async function POST(req) {
  try {
    const { listing_id, token, updates } = await req.json();
    const admin = supabaseAdmin();

    const ok = await verifyOwnerToken(admin, listing_id, token);
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only allow updating fields a professional should be able to edit themselves.
    const allowedFields = ['name', 'service', 'qualification', 'experience', 'about', 'phone', 'area', 'note', 'photo_url', 'maps_link', 'pincode'];
    const safeUpdates = {};
    for (const key of allowedFields) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    await admin.from('listings').update(safeUpdates).eq('id', listing_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
