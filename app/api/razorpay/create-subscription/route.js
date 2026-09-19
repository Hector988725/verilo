import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

// Razorpay subscriptions need a finite total_count — there's no literal
// "forever" option. 1200 monthly cycles (100 years) is the standard trick
// for "runs until the customer cancels", which is what we want here.
const TOTAL_CYCLES = 1200;

export async function POST(req) {
  try {
    const { listing_id } = await req.json();
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

    const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
    if (!planId) return NextResponse.json({ error: 'RAZORPAY_MONTHLY_PLAN_ID not configured' }, { status: 500 });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: TOTAL_CYCLES,
      notes: { listing_id },
    });

    const admin = supabaseAdmin();
    const { error: dbError } = await admin
      .from('listings')
      .update({
        razorpay_subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq('id', listing_id);

    if (dbError) {
      console.error('[create-subscription] Supabase update failed:', dbError);
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ id: subscription.id, status: subscription.status });
  } catch (err) {
    const razorpayDescription = err?.error?.description;
    const message = razorpayDescription || err?.message || 'Unknown error creating subscription';
    console.error('[create-subscription] Failed:', JSON.stringify(err, null, 2));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
