import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { adminOk } from '../../../../lib/adminGate';

const LINKS = ['none', 'whatsapp', 'call', 'link'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function mediaOk(url) {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ad-media/`;
  return typeof url === 'string' && url.startsWith(base);
}
function pathOf(url) {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ad-media/`;
  return url && url.startsWith(base) ? url.slice(base.length) : null;
}

function clean(b) {
  const advertiser = String(b.advertiser || '').trim().slice(0, 80);
  if (!advertiser) return { error: 'Advertiser ka naam likho' };
  const media_type = b.media_type === 'video' ? 'video' : 'image';
  if (!mediaOk(b.media_url)) return { error: 'Pehle image/video upload karo' };
  if (b.poster_url && !mediaOk(b.poster_url)) return { error: 'Poster galat hai' };
  const link_type = LINKS.includes(b.link_type) ? b.link_type : 'none';
  const link_value = String(b.link_value || '').trim().slice(0, 300);
  if (link_type !== 'none' && !link_value) return { error: 'Link / number daalo' };
  if (link_type === 'link' && !/^https:\/\/\S+$/i.test(link_value)) return { error: 'Website link https:// se shuru hona chahiye' };
  const cities = (Array.isArray(b.cities) ? b.cities : []).map((c) => String(c).trim().slice(0, 60)).filter(Boolean).slice(0, 60);
  const starts_on = DATE.test(b.starts_on || '') ? b.starts_on : null;
  const ends_on = DATE.test(b.ends_on || '') ? b.ends_on : null;
  if (starts_on && ends_on && ends_on < starts_on) return { error: 'Khatam hone ki tareekh shuru se pehle hai' };
  const priority = Math.max(0, Math.min(10, parseInt(b.priority, 10) || 0));
  return {
    row: {
      advertiser, title: String(b.title || '').trim().slice(0, 120) || null, media_type, media_url: b.media_url,
      poster_url: media_type === 'video' && b.poster_url ? b.poster_url : null,
      link_type, link_value: link_type === 'none' ? null : link_value, cities, starts_on, ends_on, priority,
    },
  };
}

export async function GET() {
  if (!(await adminOk())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = supabaseAdmin();
  const { data, error } = await admin.from('ads').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const count = async (id, type) => {
    const { count: c } = await admin.from('ad_events').select('id', { count: 'exact', head: true }).eq('ad_id', id).eq('event_type', type);
    return c || 0;
  };
  const ads = await Promise.all((data || []).map(async (a) => ({
    ...a, views: await count(a.id, 'view'), clicks: await count(a.id, 'click'), unmutes: await count(a.id, 'unmute'),
  })));
  return NextResponse.json({ ads });
}

export async function POST(req) {
  if (!(await adminOk())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const b = await req.json();
    const admin = supabaseAdmin();
    if (b.action === 'create' || b.action === 'update') {
      const c = clean(b);
      if (c.error) return NextResponse.json({ error: c.error }, { status: 400 });
      if (b.action === 'create') {
        const { data, error } = await admin.from('ads').insert({ ...c.row, is_active: true }).select('id').single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, id: data.id });
      }
      const { error } = await admin.from('ads').update(c.row).eq('id', b.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    if (b.action === 'toggle') {
      const { error } = await admin.from('ads').update({ is_active: !!b.is_active }).eq('id', b.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    if (b.action === 'delete') {
      const { data: ad } = await admin.from('ads').select('media_url, poster_url').eq('id', b.id).maybeSingle();
      const { error } = await admin.from('ads').delete().eq('id', b.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const paths = [pathOf(ad && ad.media_url), pathOf(ad && ad.poster_url)].filter(Boolean);
      if (paths.length) await admin.storage.from('ad-media').remove(paths);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
