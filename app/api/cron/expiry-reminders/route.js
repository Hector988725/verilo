import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { sendEmail } from '../../../../lib/email';

// Called once a day (see setup instructions) — same auth pattern as the
// expire-listings cron. Emails providers whose paid period ends within the
// next REMINDER_DAYS_BEFORE days, once per billing period (reminder_sent_for
// tracks which trial_ends_at we already reminded them about).
const REMINDER_DAYS_BEFORE = 3;

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);

  const { data: dueListings, error } = await admin
    .from('listings')
    .select('id, name, service, trial_ends_at, reminder_sent_for, owner_id, cities(name)')
    .eq('is_active', true)
    .not('owner_id', 'is', null)
    .gte('trial_ends_at', now.toISOString())
    .lte('trial_ends_at', windowEnd.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const toRemind = (dueListings || []).filter(
    (l) => l.reminder_sent_for !== l.trial_ends_at
  );

  let sent = 0;
  const failures = [];

  for (const listing of toRemind) {
    const { data: userData } = await admin.auth.admin.getUserById(listing.owner_id);
    const email = userData?.user?.email;
    if (!email) continue;

    const expiryDate = new Date(listing.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const manageUrl = `https://verilo-seven.vercel.app/city/${encodeURIComponent(listing.cities?.name || '')}/${listing.id}/manage`;

    const result = await sendEmail({
      to: email,
      subject: `Your Verilo listing "${listing.name}" expires on ${expiryDate}`,
      html: `
        <p>Hi,</p>
        <p>Your listing <strong>${listing.name}</strong> on Verilo is set to expire on <strong>${expiryDate}</strong>.</p>
        <p>Renew now to stay visible to customers without any gap:</p>
        <p><a href="${manageUrl}" style="display:inline-block;background:#9C2E20;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Renew my listing</a></p>
        <p style="color:#888;font-size:12px;">— Verilo</p>
      `,
    });

    if (result.success) {
      sent++;
      await admin.from('listings').update({ reminder_sent_for: listing.trial_ends_at }).eq('id', listing.id);
    } else {
      failures.push({ id: listing.id, error: result.error });
    }
  }

  return NextResponse.json({ checked: dueListings?.length || 0, sent, failures });
}
