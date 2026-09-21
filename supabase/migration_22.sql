-- Migration 22: Clean up legacy free-text "experience" values (entered before
-- the add/edit forms enforced a number + Years/Months dropdown) into the
-- structured "<number> Years|Months" format.

-- Salvage rows that have a number buried in messy text (e.g. "15 yeras of
-- experience") by pulling the number and guessing the unit from the text.
update listings
set experience = (regexp_match(experience, '([0-9]+)'))[1] || ' ' ||
  case when experience ~* 'month' then 'Months' else 'Years' end
where experience is not null
  and experience !~ '^[0-9]+ (Years|Months)$'
  and experience ~ '[0-9]';

-- Anything left with no number at all can't be salvaged automatically —
-- clear it so the provider can re-enter it cleanly from their dashboard.
update listings
set experience = null
where experience is not null
  and experience !~ '^[0-9]+ (Years|Months)$';
