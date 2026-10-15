import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { verifyWidgetAccessToken, extractMobile } from '../../../../lib/msg91';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { getUserFromRequest } from '../../../../lib/serverAuth';
import { clientIp, rateLimited } from '../../../../lib/rateLimit';
import { digits10, makeProof } from '../../../../lib/otpProof';

export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    // Sirf logged-in provider OTP confirm kar sakta hai.
    const user = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });

    const { access_token, phone } = await req.json();
    if (!access_token) return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
    const claimed = digits10(phone);
    if (!/^\d{10}$/.test(claimed)) return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 });

    if (
      (await rateLimited(admin, `otp_verify_user:${user.id}`, 12, 3600)) ||
      (await rateLimited(admin, `otp_verify_ip:${clientIp(req)}`, 30, 3600))
    ) {
      return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 });
    }

    // Ek access-token se sirf ek proof (replay band).
    const tokenKey = crypto.createHash('sha256').update(String(access_token)).digest('hex');
    if (await rateLimited(admin, `otp_token:${tokenKey}`, 1, 3600)) {
      return NextResponse.json({ error: 'This OTP was already used. Please request a new OTP.' }, { status: 400 });
    }

    const result = await verifyWidgetAccessToken(access_token);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

    // Agar MSG91 ne verified number bataya hai to wahi number lena zaroori hai.
    const verifiedMobile = extractMobile(result.data);
    console.log('otp/verify: msg91 response keys =', result.data ? Object.keys(result.data).join(',') : '-', '| mobile in response =', !!verifiedMobile);
    if (verifiedMobile && verifiedMobile !== claimed) {
      return NextResponse.json({ error: 'This OTP was verified for a different phone number.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, proof: makeProof(claimed, user.id) });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
