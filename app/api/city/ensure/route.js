import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { ensureCity } from '../../../../lib/cities';
import { clientIp, rateLimited } from '../../../../lib/rateLimit';

// City page pehli baar khulne par city banane ke liye (pehle browser seedha cities mein insert karta tha).
export async function POST(req) {
  try {
    const { name, state } = await req.json();
    const admin = supabaseAdmin();
    if (await rateLimited(admin, `city_ip:${clientIp(req)}`, 20, 3600)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const result = await ensureCity(admin, name, state);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ id: result.id, state: result.state });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
