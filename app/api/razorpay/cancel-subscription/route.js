import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { verifyOwnerToken } from '../../../../lib/verifyOwnerToken';

export async function POST(req) {
  try {
    const { listing_id, token } = await req.json();
    const admin = supabaseAdmin();

    const ok = await verifyOwnerToken(admin, listing_id, token);
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: listing } = await admin
      .from('listings')
      .select('razorpay_subscription_id')
      .eq('id', listing_id)
      .single();

    if (!listing?.razorpay_subscription_id) {
      return NextResponse.json({ error: 'No active AutoPay subscription found' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // cancelAtCycleEnd = true: no further charge happens, but the provider
    // keeps their already-paid days (trial_ends_at) — same as the webhook's
    // subscription.cancelled handling. We flip is_autopay off right away so
    // the daily cron resumes owning expiry for this listing.
    await razorpay.subscriptions.cancel(listing.razorpay_subscription_id, true);

    await admin
      .from('listings')
      .update({ subscription_status: 'cancelled', is_autopay: false })
      .eq('id', listing_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const razorpayDescription = err?.error?.description;
    const message = razorpayDescription || err?.message || 'Unknown error cancelling subscription';
    console.error('[cancel-subscription] Failed:', JSON.stringify(err, null, 2));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
