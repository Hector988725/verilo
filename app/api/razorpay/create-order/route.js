import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export async function POST(req) {
  try {
    const { listing_id } = await req.json();
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = parseInt(process.env.LISTING_FEE_PAISE || '3000', 10);

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `listing_${listing_id}_${Date.now()}`,
      notes: { listing_id },
    });

    const admin = supabaseAdmin();
    await admin.from('payments').insert({
      listing_id,
      razorpay_order_id: order.id,
      amount_paise: amount,
      status: 'created',
    });

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
