import { NextResponse } from 'next/server';
import { verifyWidgetAccessToken } from '../../../../lib/msg91';

export async function POST(req) {
  try {
    const { access_token } = await req.json();
    if (!access_token) return NextResponse.json({ error: 'Missing access token' }, { status: 400 });

    const result = await verifyWidgetAccessToken(access_token);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
