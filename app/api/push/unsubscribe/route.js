import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { getUserFromRequest } from '../../../../lib/serverAuth';

// POST { endpoint }
export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    const user = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const b = await req.json();
    await admin.from('provider_push_subscriptions').delete().eq('endpoint', String(b.endpoint || '')).eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }); }
}
