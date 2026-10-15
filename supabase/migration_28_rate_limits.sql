-- Migration 28: rate_limits table (OTP / listing create / city create par limit ke liye).
-- ADDITIVE — kuch bhi todta nahi. Sirf service role (API routes) is table ko chala sakta hai.
-- Pehle ye chalao, PHIR naya code deploy karo, aakhir mein migration 29.
create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_key_time_idx on public.rate_limits (key, created_at);
alter table public.rate_limits enable row level security;   -- koi policy nahi => anon/authenticated ko kuch nahi
revoke all on public.rate_limits from anon, authenticated;
