-- Migration 17: Add an optional cover/banner photo for each listing (shown
-- as a wide strip behind the avatar on the public profile page), separate
-- from the small circular profile photo.
alter table listings add column if not exists banner_url text;
