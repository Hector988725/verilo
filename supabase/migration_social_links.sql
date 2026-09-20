-- Store ke social media links (sab optional) — customer storefront ke
-- footer mein sirf woh icons dikhenge jinki link dukaandar ne di hai.
alter table stores add column if not exists facebook_url text;
alter table stores add column if not exists instagram_url text;
alter table stores add column if not exists youtube_url text;
alter table stores add column if not exists gmb_url text; -- Google Business Profile / Google Maps listing
