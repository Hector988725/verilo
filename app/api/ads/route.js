import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { adMatchesCity, todayIST } from '../../../lib/adsUtil';

// Public: is shehar ke chalu ads. Sirf zaroori fields wapas (advertiser ka andar ka data nahi).
export async function GET(req) {
  try {
    const city = (new URL(req.url).searchParams.get('city') || '').trim().slice(0, 80);
    const today = todayIST();
    const { data, error } = await supabaseAdmin()
      .from('ads')
      .select('id, media_type, media_url, poster_url, link_type, link_value, title, cities, starts_on, ends_on, priority')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) throw error;
    const ads = (data || [])
      .filter((a) => (!a.starts_on || a.starts_on <= today) && (!a.ends_on || a.ends_on >= today) && adMatchesCity(a, city))
      .slice(0, 12)
      .map((a) => ({ id: a.id, media_type: a.media_type, media_url: a.media_url, poster_url: a.poster_url, link_type: a.link_type, link_value: a.link_value, title: a.title, priority: a.priority }));
    return NextResponse.json({ ads }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch (e) {
    console.error('[ads] list failed', e);
    return NextResponse.json({ ads: [] });
  }
}
