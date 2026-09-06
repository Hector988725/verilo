import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { isAdminAuthenticated } from '../../../../lib/adminAuth';

export async function POST(req) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { report_id } = await req.json();
  const admin = supabaseAdmin();
  await admin.from('reports').delete().eq('id', report_id);

  return NextResponse.json({ success: true });
}
