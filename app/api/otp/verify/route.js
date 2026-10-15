import { NextResponse } from 'next/server';
import { verifyOtp } from '../../../../lib/msg91';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { getUserFromRequest } from '../../../../lib/serverAuth';
import { rateLimited } from '../../../../lib/rateLimit';
import { digits10, makeProof } from '../../../../lib/otpProof';

export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    const user = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });

    const { phone, otp } = await req.json();
    if (!phone || !otp) return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    const d = digits10(phone);
    if (
      (await rateLimited(admin, `otp_verify_phone:${d}`, 6, 600)) ||
      (await rateLimited(admin, `otp_verify_user:${user.id}`, 12, 3600))
    ) {
      return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 });
    }
    const result = await verifyOtp(phone, otp);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    // Signed proof: is user ne ye phone verify kiya (15 min valid). /api/listing/create yahi maangta hai.
    return NextResponse.json({ success: true, proof: makeProof(phone, user.id) });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
