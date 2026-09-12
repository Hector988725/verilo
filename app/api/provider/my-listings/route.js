import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const accessToken = authHeader.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { data, error } = await admin
      .from('listings')
      .select('id, name, service, phone, is_active, manage_token, trial_ends_at, city_id, cities(name, state)')
      .eq('owner_id', userData.user.id)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ listings: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
