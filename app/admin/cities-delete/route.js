import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { isAdminAuthenticated } from '../../../../lib/adminAuth';

export async function POST(req) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { city_id } = await req.json();
    const admin = supabaseAdmin();

    // Safety check: never delete a city that still has listings attached —
    // those would need to be moved first (same as the earlier duplicate-city
    // cleanup), not silently orphaned.
    const { count, error: countError } = await admin
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city_id);

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
    if (count > 0) {
      return NextResponse.json({ error: `This city still has ${count} listing(s) attached. Move them first.` }, { status: 400 });
    }

    const { error } = await admin.from('cities').delete().eq('id', city_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
