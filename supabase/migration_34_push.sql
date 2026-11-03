-- ============================================================
-- VERILO: provider push notifications (free Web Push)
-- ============================================================
-- Provider ko phone par alert: naya review, aur kisi ne Call / WhatsApp dabaya.
-- Table sirf server (service role) padhta/likhta hai; browser se seedha access band.
create table if not exists provider_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_provider_push_user on provider_push_subscriptions(user_id);
alter table provider_push_subscriptions enable row level security;
revoke all on provider_push_subscriptions from anon, authenticated;
