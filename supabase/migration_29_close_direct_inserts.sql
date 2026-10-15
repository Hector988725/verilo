-- Migration 29: browser se seedha listings / cities mein insert band.
-- !! Sirf tab chalao jab naya code deploy ho chuka ho aur "Add Listing" naye route se chal rahi ho. !!
-- (Pehle chala diya to purana code Add Listing nahi kar payega.)
--
-- Listing/city ab sirf /api/listing/create aur /api/city/ensure (service role) se bante hain.
-- reports: reason 1..500 characters (NOT VALID = purani rows ko nahi chhedta, nayi par lagta hai).
-- Undo: undo_29_close_direct_inserts.sql
revoke insert on public.listings from anon, authenticated;
revoke insert on public.cities from anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reports_reason_len') then
    alter table public.reports add constraint reports_reason_len check (char_length(reason) between 1 and 500) not valid;
  end if;
end $$;
