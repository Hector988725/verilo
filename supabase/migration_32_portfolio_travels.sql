-- ============================================================
-- Verilo P2: portfolio gallery + "travels to" (event professionals).
--
-- listings me 2 naye optional columns:
--   portfolio_urls  text[]  -> max 6 photo URLs (server check karta hai: apne listing-photos bucket ke hi)
--   travels_to      text    -> "Anuppur, Shahdol, Rewa" jaisa free text
--
-- Sirf naye columns jud rahe hain, koi purani listing nahi badalti. Dobara run karna safe hai.
-- Migration 27 ke rule ke mutabik naye columns par anon/authenticated SELECT dena zaroori hai
-- (warna public page par ye columns nahi dikhte). manage_token jaise secret columns ko haath nahi lagaya.
-- Undo: undo_32_portfolio_travels.sql
-- ============================================================

alter table public.listings add column if not exists portfolio_urls text[];
alter table public.listings add column if not exists travels_to text;

grant select (portfolio_urls, travels_to) on public.listings to anon, authenticated;

-- Check (sirf padhta hai): dono columns dikhne chahiye.
select column_name::text, data_type::text
from information_schema.columns
where table_schema = 'public' and table_name = 'listings'
  and column_name in ('portfolio_urls', 'travels_to');
