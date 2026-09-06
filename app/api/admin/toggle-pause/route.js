import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { isAdminAuthenticated } from '../../../../lib/adminAuth';

export async function POST(req) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listing_id, is_active } = await req.json();
  const admin = supabaseAdmin();
  await admin.from('listings').update({ is_active }).eq('id', listing_id);

  return NextResponse.json({ success: true });
}
