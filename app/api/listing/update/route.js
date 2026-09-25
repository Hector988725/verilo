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
    const allowedFields = ['name', 'service', 'qualification', 'experience', 'about', 'phone', 'area', 'note', 'photo_url', 'banner_url', 'banner_position', 'maps_link', 'pincode', 'fb_url', 'instagram_url', 'youtube_url', 'gmb_url'];
    const safeUpdates = {};
    for (const key of allowedFields) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    // If the phone number is changing, the OTP verification no longer
    // applies to the new number — reset it so the Verified badge stays honest.
    if ('phone' in safeUpdates) {
      const { data: current } = await admin.from('listings').select('phone').eq('id', listing_id).single();
      if (current && current.phone !== safeUpdates.phone) {
        safeUpdates.phone_verified = false;
      }
    }

    await admin.from('listings').update(safeUpdates).eq('id', listing_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
