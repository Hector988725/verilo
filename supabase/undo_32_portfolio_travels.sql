-- Undo migration 32. Dhyan: isse in columns ka saara data (portfolio photos ki list, travels_to) hat jayega.
alter table public.listings drop column if exists portfolio_urls;
alter table public.listings drop column if exists travels_to;
