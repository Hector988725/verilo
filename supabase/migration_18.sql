-- Migration 18: Ratings/reviews now require a logged-in customer account —
-- browsing, calling, and WhatsApp-ing providers still needs NO login at all.
-- This cuts down anonymous/spam reviews and stops the same person leaving
-- multiple reviews for one listing, without requiring login anywhere else.

alter table ratings add column if not exists customer_id uuid references auth.users(id);

-- One review per customer per listing (they can still edit their own later
-- if that's ever added, but can't spam multiple entries).
create unique index if not exists ratings_listing_customer_unique
  on ratings(listing_id, customer_id)
  where customer_id is not null;

-- Anonymous/public inserts are no longer allowed — only a signed-in customer
-- inserting a rating under their own account.
drop policy if exists "public insert ratings" on ratings;
create policy "ratings_insert_own" on ratings
  for insert
  with check (auth.uid() = customer_id);

-- Reading ratings/reviews stays fully public — no login needed to see them.
-- (the "public read ratings" policy from schema.sql already covers this)
