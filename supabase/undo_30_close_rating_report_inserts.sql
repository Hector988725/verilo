-- Undo migration 30: direct insert wapas (RLS policies waise hi hain: ratings sirf apne customer_id se, reports sabke liye).
grant insert on public.ratings to anon, authenticated;
grant insert on public.reports to anon, authenticated;
