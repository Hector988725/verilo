import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseClient';

// Verifies a manage_token server-side using the service role key (which can
// read the column even though the public anon key cannot). The real token
// value is never sent back to the browser — only true/false.
export async function POST(req) {
  try {
    const { listing_id, token } = await req.json();
    if (!listing_id || !token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data } = await admin.from('listings').select('manage_token').eq('id', listing_id).single();

    const valid = !!(data && data.manage_token && data.manage_token === token);
    return NextResponse.json({ valid });
  } catch (err) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
