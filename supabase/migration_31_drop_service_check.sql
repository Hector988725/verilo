-- ============================================================
-- Verilo FIX: listings.service ka purana CHECK constraint hatana.
--
-- Problem: constraint sirf 10 values deta hai (plumber, electrician, mistri, mechanic, ac-repair,
-- beautician, tailor, tuition, milk-veg, other). App me astrologer, transport, tattoo bhi category hain,
-- par database unhe mana kar deta hai -> in categories me listing banti hi nahi.
--
-- Fix: constraint hatao. Category ki asli jaanch ab server me hai (api/listing/create aur
-- api/listing/update, dono lib/categories.js ki list se check karte hain). Browser seedha listings me
-- insert/update nahi kar sakta (migration 29), isliye server hi eklauta likhne wala hai.
--
-- Koi purani listing nahi tootti (constraint sirf hat raha hai). Dobara run karna safe hai.
-- Undo: undo_31_drop_service_check.sql
-- ============================================================

alter table public.listings drop constraint if exists listings_service_check;

-- Check (ye sirf padhta hai): "listings_service_check" ab list me nahi dikhna chahiye.
select conname::text as constraint_name, pg_get_constraintdef(oid) as detail
from pg_constraint
where conrelid = 'public.listings'::regclass;
