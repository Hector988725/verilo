import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

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
    .lt('trial_ends_at', now)
    .select('id, name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deactivated_count: expired?.length || 0, deactivated: expired || [] });
}
