import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { isAdminAuthenticated } from '../../../../lib/adminAuth';

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data } = await admin
    .from('listings')
    .select('*, cities(name)')
    .order('trial_ends_at', { ascending: true });

  return NextResponse.json({ listings: data || [] });
}
