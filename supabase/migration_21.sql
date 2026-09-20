-- Migration 21: Let providers add their own social/business profile links
-- (Facebook, Instagram, YouTube, Google Business Profile), shown as icon
-- links on their public profile page. All optional.

alter table listings add column if not exists fb_url text;
alter table listings add column if not exists instagram_url text;
alter table listings add column if not exists youtube_url text;
alter table listings add column if not exists gmb_url text;
