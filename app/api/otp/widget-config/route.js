import { NextResponse } from 'next/server';

// Serves MSG91 Widget config to the browser at runtime instead of baking it
// into the JS bundle via NEXT_PUBLIC_ env vars. This way rotating the token
// is just a Vercel env var change + redeploy of this one tiny route, and
// the value never sits permanently in build output or source control.
export async function GET() {
  const widgetId = process.env.MSG91_WIDGET_ID;
  const tokenAuth = process.env.MSG91_TOKEN_AUTH;
  if (!widgetId || !tokenAuth) {
    return NextResponse.json({ error: 'MSG91 widget not configured' }, { status: 500 });
  }
  return NextResponse.json({ widgetId, tokenAuth });
}
