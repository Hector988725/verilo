-- Migration 23: Lightweight analytics — tracks profile views and
-- Call/WhatsApp button clicks per listing, so providers can see the value
-- of staying active/renewing on their dashboard.

create table if not exists listing_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'call', 'whatsapp')),
  created_at timestamptz not null default now()
);

create index if not exists listing_events_listing_id_idx on listing_events(listing_id);
create index if not exists listing_events_type_idx on listing_events(listing_id, event_type);
