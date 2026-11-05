import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { notifyProvider } from '../../../../lib/pushServer';

// Called once a day by Vercel Cron (see vercel.json). Automatically hides any
// listing whose paid period has lapsed, instead of relying on manual review.
export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: expired, error } = await admin
    .from('listings')
    .update({ is_active: false })
    .eq('is_active', true)
    .eq('is_autopay', false) // AutoPay listings are deactivated by the subscription webhook, not this cron
    .lt('trial_ends_at', now)
    .select('id, name, owner_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Provider ko phone par alert: listing band ho gayi
  for (const l of expired || []) {
    if (!l.owner_id) continue;
    await notifyProvider(admin, l.owner_id, {
      title: '⚠️ Your Verilo listing has expired',
      body: `"${l.name}" is no longer visible to customers. Renew now to go live again.`,
      tag: 'expired-' + l.id,
    });
  }

  return NextResponse.json({ deactivated_count: expired?.length || 0, deactivated: expired || [] });
}
