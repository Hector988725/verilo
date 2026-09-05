import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

// Plan pricing: months -> amount in paise. Longer plans are discounted to
// encourage upfront payment (better cash flow, fewer reminders needed).
const PLANS = {
  1: 3000,    // ₹30 for 1 month
  6: 15000,   // ₹150 for 6 months (1 month free vs ₹180)
  12: 30000,  // ₹300 for 12 months (2 months free vs ₹360)
};

export async function POST(req) {
  try {
    const { listing_id, months } = await req.json();
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

    const plan = PLANS[months] ? months : 1;
    const amount = PLANS[plan];

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `listing_${listing_id}_${Date.now()}`,
      notes: { listing_id, months: String(plan) },
    });

    const admin = supabaseAdmin();
    await admin.from('payments').insert({
      listing_id,
      razorpay_order_id: order.id,
      amount_paise: amount,
      status: 'created',
    });

    return NextResponse.json({ ...order, months: plan });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
