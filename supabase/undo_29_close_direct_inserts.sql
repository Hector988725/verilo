-- Undo migration 29: direct insert wapas (RLS policies waise hi rahi hain).
grant insert on public.listings to anon, authenticated;
grant insert on public.cities to anon, authenticated;
alter table public.reports drop constraint if exists reports_reason_len;
