-- Migration 20: Razorpay Subscriptions (AutoPay) support for the ₹30/month plan.
-- 6-month and 12-month plans stay exactly as they are (one-time, via the
-- existing payments table + create-order/verify routes). This only adds
-- what's needed to track a recurring monthly subscription per listing.
--
-- is_autopay = true means this listing's monthly fee is on Razorpay AutoPay
-- and its is_active / trial_ends_at fields are being driven by the
-- subscription webhook, NOT by a one-time payment. The daily expiry cron
-- skips any listing where is_autopay = true, so it never fights the webhook.
--
-- subscription_status mirrors Razorpay's own subscription status values:
-- 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed'

alter table listings add column if not exists razorpay_subscription_id text;
alter table listings add column if not exists is_autopay boolean not null default false;
alter table listings add column if not exists subscription_status text;

create index if not exists listings_subscription_id_idx on listings(razorpay_subscription_id);
