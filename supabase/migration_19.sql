-- Migration 19: Show the reviewer's name alongside their rating (like
-- "Rohit Kumar, 2 days ago"), instead of anonymous star-only reviews.
alter table ratings add column if not exists reviewer_name text;
