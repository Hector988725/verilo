import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export async function POST(req) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listing_id } = body;

    // Verify the payment signature — this proves the payment actually happened via Razorpay
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const admin = supabaseAdmin();

    await admin
      .from('payments')
      .update({ razorpay_payment_id, status: 'paid', period_start: new Date().toISOString() })
      .eq('razorpay_order_id', razorpay_order_id);

    // Extend the listing's active period by 30 days from today
    const newTrialEnd = new Date();
    newTrialEnd.setDate(newTrialEnd.getDate() + 30);
    await admin.from('listings').update({ trial_ends_at: newTrialEnd.toISOString(), is_active: true }).eq('id', listing_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
