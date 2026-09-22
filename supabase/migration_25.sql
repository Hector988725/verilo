-- Migration 25: Store the provider's chosen banner crop/position (vertical
-- focus point, e.g. "center 30%") so faces/subjects in the cover photo
-- don't get cut off by a fixed 'center' crop on the 16:9 profile banner.

alter table listings add column if not exists banner_position text default 'center';
