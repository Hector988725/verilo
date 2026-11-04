-- Migration 30: browser se seedha ratings / reports mein insert band.
-- !! Sirf tab chalao jab naya code deploy ho chuka ho (Rating aur Report ab /api/rating/create aur /api/report/create se jaate hain). !!
-- Pehle chala diya to purane code se rating/report dena band ho jayega.
--
-- Fayda: koi bhi browser console se unlimited ratings/reports (ya doosre ke naam se rating) nahi daal sakta;
-- sab server route se jaata hai jahan login, apni listing ko rating nahi, aur rate limit lagi hai.
-- Padhna (select) waise hi rahega. Undo: undo_30_close_rating_report_inserts.sql
revoke insert on public.ratings from anon, authenticated;
revoke insert on public.reports from anon, authenticated;
