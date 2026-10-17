import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { getUserFromRequest } from '../../../../lib/serverAuth';
import { clientIp, rateLimited } from '../../../../lib/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rating dene ka EKLAUTA raasta (migration 30 ke baad browser se seedha insert band).
// Rokte hain: bina login rating, apni hi listing ko rating, ek account/IP se bahut zyada ratings.
export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    const user = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });

    const b = await req.json();
    const listingId = String(b.listing_id || '');
    if (!UUID_RE.test(listingId)) return NextResponse.json({ error: 'Invalid listing' }, { status: 400 });

    const stars = Number(b.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return NextResponse.json({ error: 'Please select a star rating first.' }, { status: 400 });

    const name = String(b.reviewer_name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 60) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });

    let text = b.review_text == null ? '' : String(b.review_text).trim();
    if (text.length > 600) return NextResponse.json({ error: 'Review is too long (max 600 characters).' }, { status: 400 });
    if (!text) text = null;

    const { data: listing } = await admin.from('listings').select('id, owner_id, is_active').eq('id', listingId).maybeSingle();
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    // Apni hi listing ko rating nahi (listing jis account se bani hai wahi account).
    if (listing.owner_id && listing.owner_id === user.id) {
      return NextResponse.json({ error: 'You cannot rate your own listing.' }, { status: 403 });
    }

    const ip = clientIp(req);
    if (
      (await rateLimited(admin, `rate_user:${user.id}`, 10, 86400)) ||
      (await rateLimited(admin, `rate_ip:${ip}`, 30, 3600)) ||
      // ek hi IP se ek listing par din me 2 se zyada ratings nahi (alag-alag fake accounts se bhi nahi)
      (await rateLimited(admin, `rate_ip_listing:${ip}:${listingId}`, 2, 86400))
    ) {
      return NextResponse.json({ error: 'Too many ratings. Please try again later.' }, { status: 429 });
    }

    const { error } = await admin.from('ratings').insert({
      listing_id: listingId, customer_id: user.id, stars, review_text: text, reviewer_name: name,
    });
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: "You've already reviewed this listing." }, { status: 409 });
      return NextResponse.json({ error: 'Could not save your rating. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
