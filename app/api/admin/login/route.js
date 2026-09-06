import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  const { passcode } = await req.json();

  // Server-only secret — this env var has NO NEXT_PUBLIC_ prefix, so it is
  // never bundled into client JavaScript and cannot be read via "View Source".
  if (passcode !== process.env.ADMIN_PASSCODE) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // httpOnly cookie: browsers send it automatically on requests, but
  // client-side JavaScript can never read its value (blocks basic snooping).
  cookies().set('verilo_admin', process.env.ADMIN_PASSCODE, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return NextResponse.json({ success: true });
}
