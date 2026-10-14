-- Undo: listings ka poora SELECT wapas (anon + authenticated). Token rotate wapas nahi hota.
grant select on public.listings to anon, authenticated;
