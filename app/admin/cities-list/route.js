import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { isAdminAuthenticated } from '../../../../lib/adminAuth';

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data: cities, error } = await admin.from('cities').select('id, name, state').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: listings } = await admin.from('listings').select('city_id');
  const counts = {};
  (listings || []).forEach((l) => { counts[l.city_id] = (counts[l.city_id] || 0) + 1; });

  const result = (cities || []).map((c) => ({ ...c, listing_count: counts[c.id] || 0 }));
  return NextResponse.json({ cities: result });
}
