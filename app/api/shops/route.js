import { NextResponse } from 'next/server';
import { fetchDukaanShops } from '../../../lib/dukaanShops';

export const dynamic = 'force-dynamic';

// GET /api/shops?city=Anuppur&state=Madhya%20Pradesh
// Dukaan Order System ki opt-in shops (aur unke products) us city ke liye. Public data, sirf padhna.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const result = await fetchDukaanShops({
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
  });
  return NextResponse.json(
    { shops: result.shops, ...(result.ok ? {} : { problem: result.reason }) },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } }
  );
}
