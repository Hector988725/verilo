import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

// Called from the client right after Razorpay's checkout handler fires for a
// subscription payment. This gives instant UI feedback ("you're live!")
// without waiting for the webhook, which is the real source of truth for
// everything that happens afterwards (renewals, failures, cancellation).
export async function POST(req) {
  try {
    const body = await req.json();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, listing_id } = body;

    // Signature formula for subscriptions is payment_id|subscription_id
    // (different from the order_id|payment_id formula used for one-time orders).
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Give one paid month from today. The webhook's subscription.charged
    // event will push this forward on every future renewal.
    const newTrialEnd = new Date();
    newTrialEnd.setDate(newTrialEnd.getDate() + 30);

    await admin
      .from('listings')
      .update({
        is_active: true,
        is_autopay: true,
        subscription_status: 'active',
        trial_ends_at: newTrialEnd.toISOString(),
      })
      .eq('id', listing_id)
      .eq('razorpay_subscription_id', razorpay_subscription_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
