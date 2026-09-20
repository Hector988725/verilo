-- Dukaan ki exact location (Google Maps se "Share" karke mila link) —
-- optional. Agar yeh na ho, customer view "address" field se hi ek
-- approximate "Get Directions" link bana leta hai.
alter table stores add column if not exists maps_link text;
