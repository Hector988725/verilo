-- Migration 24: Track which trial_ends_at a renewal reminder was last sent
-- for, so we never spam the same reminder twice for the same paid period —
-- and it naturally resets the next time the listing is renewed (since
-- trial_ends_at changes, this stored value stops matching).

alter table listings add column if not exists reminder_sent_for timestamptz;
