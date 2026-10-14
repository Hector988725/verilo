-- READ-ONLY: migration ke baad chalao. manage_token, owner_id, razorpay_subscription_id,
-- reminder_sent_for ke saamne false aana chahiye; baaki sab true.
select c.column_name,
       has_column_privilege('anon', 'public.listings', c.column_name, 'select') as anon_can_read
from information_schema.columns c
where c.table_schema = 'public' and c.table_name = 'listings'
order by c.ordinal_position;
