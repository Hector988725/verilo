-- Migration 26: Phone OTP verification for providers, to cut down on fake
-- listings. phone_verified is set true once a provider successfully
-- verifies their number via OTP at signup. If they later change their
-- phone number on an existing listing, this is reset to false until they
-- re-verify (handled in the edit API route).

alter table listings add column if not exists phone_verified boolean not null default false;
