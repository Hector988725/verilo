import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { rateLimited, clientIp } from '../../../../lib/rateLimit';

export async function POST(req) {
  // Andaaze lagane se bachav: ek IP se 15 minute me 8 koshish (galat ya sahi) se zyada nahi.
  if (await rateLimited(supabaseAdmin(), 'admin_login:' + clientIp(req), 8, 900)) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Try again after 15 minutes.' }, { status: 429 });
  }
  const { passcode } = await req.json().catch(() => ({}));

  // Server-only secret — this env var has NO NEXT_PUBLIC_ prefix, so it is
  // never bundled into client JavaScript and cannot be read via "View Source".
  if (passcode !== process.env.ADMIN_PASSCODE) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // httpOnly cookie: browsers send it automatically on requests, but
  // client-side JavaScript can never read its value (blocks basic snooping).
  (await cookies()).set('verilo_admin', process.env.ADMIN_PASSCODE, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return NextResponse.json({ success: true });
}
