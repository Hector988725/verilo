import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { getUserFromRequest } from '../../../../lib/serverAuth';

// POST { endpoint, keys: { p256dh, auth } }  (provider login zaroori)
export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    const user = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const b = await req.json();
    const endpoint = String(b.endpoint || '');
    const p256dh = String(b.keys?.p256dh || ''), auth = String(b.keys?.auth || '');
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    // ek device = ek account: device ab isi user ka
    const { error } = await admin.from('provider_push_subscriptions').upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: 'endpoint' });
    if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }); }
}
