import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

// Configure this exact URL in Razorpay Dashboard -> Settings -> Webhooks,
// with the same secret as RAZORPAY_WEBHOOK_SECRET, subscribed to:
// subscription.activated, subscription.charged, subscription.pending,
// subscription.halted, subscription.cancelled, subscription.completed.
//
// This is the source of truth for AutoPay listings going forward — the
// client-side verify-subscription route only handles the very first payment
// for instant UI feedback.
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!signature || signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const subEntity = event?.payload?.subscription?.entity;
  const subscriptionId = subEntity?.id;

  if (!subscriptionId) {
    // Not a subscription event we care about — acknowledge and move on.
    return NextResponse.json({ received: true });
  }

  const admin = supabaseAdmin();

  try {
    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        // A successful charge — extend access by one more month from today
        // and log it in the payments table for the same reporting the
        // one-time plans already use.
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
          .eq('razorpay_subscription_id', subscriptionId);

        const paymentEntity = event?.payload?.payment?.entity;
        if (paymentEntity) {
          const { data: listing } = await admin
            .from('listings')
            .select('id')
            .eq('razorpay_subscription_id', subscriptionId)
            .single();

          if (listing) {
            await admin.from('payments').insert({
              listing_id: listing.id,
              razorpay_payment_id: paymentEntity.id,
              amount_paise: paymentEntity.amount,
              status: 'paid',
              period_start: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'subscription.pending':
        // A renewal charge failed once but Razorpay is retrying — don't
        // cut access yet, just reflect the status so the provider can see it.
        await admin
          .from('listings')
          .update({ subscription_status: 'pending' })
          .eq('razorpay_subscription_id', subscriptionId);
        break;

      case 'subscription.halted':
        // Retries exhausted — AutoPay has effectively stopped. Deactivate
        // the listing right away rather than waiting for trial_ends_at.
        await admin
          .from('listings')
          .update({ subscription_status: 'halted', is_autopay: false, is_active: false })
          .eq('razorpay_subscription_id', subscriptionId);
        break;

      case 'subscription.cancelled':
        // Provider cancelled (or we cancelled via the API). Turn off
        // is_autopay so the daily cron takes over expiry again — the
        // listing stays visible until the already-paid trial_ends_at date.
        await admin
          .from('listings')
          .update({ subscription_status: 'cancelled', is_autopay: false })
          .eq('razorpay_subscription_id', subscriptionId);
        break;

      case 'subscription.completed':
        await admin
          .from('listings')
          .update({ subscription_status: 'completed', is_autopay: false })
          .eq('razorpay_subscription_id', subscriptionId);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[subscription-webhook] Failed:', err);
    // Still 200 so Razorpay doesn't hammer retries for a transient DB hiccup
    // it can't fix by resending the same event; log for manual follow-up.
    return NextResponse.json({ received: true, warning: err.message });
  }
}
