-- ============================================================
-- Verilo SECURITY FIX 1: listings ke secret columns anon/authenticated se chhupana
-- + sabhi manage_token naye bana dena.
--
-- Problem: "public read listings" policy row-level hai, columns par koi rok nahi thi,
-- isliye anon key se manage_token (listing ki secret chabi) padhi ja sakti thi.
--
-- Fix:
--  1. listings par poora SELECT hatao (anon + authenticated).
--  2. Sirf safe columns ka SELECT wapas do. In 4 ka NAHI:
--       manage_token, razorpay_subscription_id, reminder_sent_for, owner_id
--  3. Sabhi manage_token naye (purane leak ho sakte the).
--
-- service_role (API routes) par koi asar nahi. INSERT/UPDATE/DELETE grants waise hi.
-- Undo: undo_verilo_hide_secrets.sql  (token rotate wapas nahi hota).
-- Idempotent: dobara run safe (par token dobara badal jaate hain).
-- ============================================================

do $$
declare cols text;
begin
  select string_agg(format('%I', column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'listings'
    and column_name not in ('manage_token', 'razorpay_subscription_id', 'reminder_sent_for', 'owner_id');

  revoke select on public.listings from anon, authenticated;
  execute 'grant select (' || cols || ') on public.listings to anon, authenticated';
end $$;

-- Sabke token naye (purane link/token ab kaam nahi karenge; login wale /provider/dashboard se manage karein).
do $$
declare t text;
begin
  select data_type into t from information_schema.columns
   where table_schema = 'public' and table_name = 'listings' and column_name = 'manage_token';
  if t = 'uuid' then
    update public.listings set manage_token = gen_random_uuid();
  else
    update public.listings set manage_token = gen_random_uuid()::text;
  end if;
end $$;
