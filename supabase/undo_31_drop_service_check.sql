-- Undo for migration_31: purana constraint wapas (sirf purani 10 categories allowed).
-- Dhyan: agar tab tak astrologer / transport / tattoo ya naye event categories wali listings ban chuki hon,
-- to ye command fail hogi (constraint un rows ko mana karega). Pehle un rows ki service badalni padegi.

alter table public.listings drop constraint if exists listings_service_check;
alter table public.listings add constraint listings_service_check
  check (service = any (array['plumber','electrician','mistri','mechanic','ac-repair','beautician','tailor','tuition','milk-veg','other']));
