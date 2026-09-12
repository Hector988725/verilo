-- Migration 16: Provider accounts (email/password login for service providers).
-- Customers still need NO login at all — browsing and calling stays fully open.
-- Providers can now sign up/log in and see all their listings in one dashboard,
-- from any device — this links each listing to their account (owner_id) in
-- addition to the existing manage_token (which keeps working for anyone who
-- still has an old private link saved).

alter table listings add column if not exists owner_id uuid references auth.users(id);
create index if not exists listings_owner_id_idx on listings(owner_id);

-- Tighten the wide-open "public insert" policy: anyone can still create a
-- listing (no login required to browse OR to list — but a listing's owner_id
-- must be either blank or the actual logged-in provider creating it, so a
-- provider can never insert a row claiming to be owned by someone else.
drop policy if exists "public insert listings" on listings;
create policy "public insert listings" on listings
  for insert
  with check (owner_id is null or owner_id = auth.uid());
