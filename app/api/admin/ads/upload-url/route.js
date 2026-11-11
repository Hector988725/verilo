import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseClient';
import { adminOk } from '../../../../../lib/adminGate';

const EXT = { image: ['jpg', 'jpeg', 'png', 'webp'], video: ['mp4', 'webm'], poster: ['jpg'] };
const MAX = { image: 2 * 1024 * 1024, video: 5 * 1024 * 1024, poster: 400 * 1024 };

// Admin ke liye ek-baar ka upload link (file seedha Supabase storage me jaati hai).
export async function POST(req) {
  if (!(await adminOk())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { kind, ext, size } = await req.json();
    const e = String(ext || '').toLowerCase().replace('.', '');
    if (!EXT[kind] || !EXT[kind].includes(e)) return NextResponse.json({ error: 'File type allowed nahi hai' }, { status: 400 });
    if (!(size > 0) || size > MAX[kind]) return NextResponse.json({ error: `File bahut badi hai (max ${Math.round(MAX[kind] / 1024 / 1024 * 10) / 10} MB)` }, { status: 400 });
    const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${e}`;
    const admin = supabaseAdmin();
    const { data, error } = await admin.storage.from('ad-media').createSignedUploadUrl(path);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: pub } = admin.storage.from('ad-media').getPublicUrl(path);
    return NextResponse.json({ path, token: data.token, publicUrl: pub.publicUrl });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
