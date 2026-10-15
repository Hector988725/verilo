import { NextResponse } from 'next/server';
import { sendOtp } from '../../../../lib/msg91';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { getUserFromRequest } from '../../../../lib/serverAuth';
import { clientIp, rateLimited } from '../../../../lib/rateLimit';
import { digits10 } from '../../../../lib/otpProof';

export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    // Sirf logged-in provider OTP mangwa sakta hai (anonymous SMS-bombing band).
    const user = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });

    const { phone } = await req.json();
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 });
    }
    const d = digits10(phone);
    if (
      (await rateLimited(admin, `otp_send_phone:${d}`, 3, 600)) ||
      (await rateLimited(admin, `otp_send_user:${user.id}`, 6, 3600)) ||
      (await rateLimited(admin, `otp_send_ip:${clientIp(req)}`, 10, 3600))
    ) {
      return NextResponse.json({ error: 'Too many OTP requests. Please wait a few minutes and try again.' }, { status: 429 });
    }
    const result = await sendOtp(phone);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
