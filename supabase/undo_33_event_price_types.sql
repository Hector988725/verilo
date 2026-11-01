-- Undo migration 33. Dhyan: in columns ka saara data hat jayega.
alter table public.listings drop column if exists starting_price;
alter table public.listings drop column if exists event_types;
