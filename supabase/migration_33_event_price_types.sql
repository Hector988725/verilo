-- ============================================================
-- Verilo P2b: event listings ke liye "starting price" aur "event types".
--
--   starting_price  integer -> rupees me, jaise 5000 (server 0 se 9999999 tak poora number hi maanta hai)
--   event_types     text[]  -> jaise {Wedding,Birthday} (server sirf lib/categories.js ki EVENT_TYPES list se maanta hai)
--
-- Sirf naye optional columns; purani listings par koi asar nahi. Dobara run karna safe hai.
-- Migration 27 ke rule se naye columns par anon/authenticated SELECT diya hai.
-- Undo: undo_33_event_price_types.sql
-- ============================================================

alter table public.listings add column if not exists starting_price integer;
alter table public.listings add column if not exists event_types text[];

grant select (starting_price, event_types) on public.listings to anon, authenticated;

-- Check (sirf padhta hai): 2 rows dikhni chahiye.
select column_name::text, data_type::text
from information_schema.columns
where table_schema = 'public' and table_name = 'listings'
  and column_name in ('starting_price', 'event_types');
