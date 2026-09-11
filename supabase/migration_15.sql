-- Migration 15: Customer accounts (Google login) support — Bookings & Saved listings.
-- Customers authenticate via Supabase Auth (Google OAuth). Providers still have
-- no login — they continue to manage their listing via the existing secret
-- manage_token link, so booking status updates from the provider side go
-- through a server-side API route (using the service role key), not RLS.

-- ============ SAVED LISTINGS (customer favorites) ============
create table if not exists saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

alter table saved_listings enable row level security;

-- A logged-in customer can only see/add/remove their own saved listings.
create policy "saved_listings_select_own" on saved_listings
  for select using (auth.uid() = user_id);

create policy "saved_listings_insert_own" on saved_listings
  for insert with check (auth.uid() = user_id);

create policy "saved_listings_delete_own" on saved_listings
  for delete using (auth.uid() = user_id);


-- ============ BOOKINGS / ENQUIRIES ============
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'accepted', 'rejected', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bookings enable row level security;

-- A logged-in customer can create a booking for themself and see their own bookings.
create policy "bookings_select_own" on bookings
  for select using (auth.uid() = customer_id);

create policy "bookings_insert_own" on bookings
  for insert with check (auth.uid() = customer_id);

-- No update/delete policy for customers or anon — status changes (accept/reject)
-- only happen server-side via /api/bookings/respond, which verifies the
-- provider's manage_token and uses the service role key to bypass RLS.

create index if not exists bookings_listing_id_idx on bookings(listing_id);
create index if not exists bookings_customer_id_idx on bookings(customer_id);
