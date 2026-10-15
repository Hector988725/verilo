import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { getUserFromRequest } from '../../../../lib/serverAuth';
import { clientIp, rateLimited } from '../../../../lib/rateLimit';
import { checkProof, digits10 } from '../../../../lib/otpProof';
import { ensureCity } from '../../../../lib/cities';
import { CATEGORIES } from '../../../../lib/categories';

const SERVICES = CATEGORIES.map((c) => c.key).filter((k) => k !== 'all');

function str(v, max) {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).trim();
  return s.length > max ? undefined : s || null; // undefined = bahut lamba
}

function storageUrlOk(u) {
  if (!u) return true;
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/`;
  return typeof u === 'string' && u.startsWith(base) && u.length < 600;
}

// Listing banane ka EKLAUTA raasta. is_active/verified/trial/token/owner sab yahin server par set hote hain —
// browser inhe set nahi kar sakta (migration 29 ke baad direct insert band hai).
export async function POST(req) {
  try {
    const admin = supabaseAdmin();
    const user = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });

    if (
      (await rateLimited(admin, `create_user:${user.id}`, 20, 86400)) ||
      (await rateLimited(admin, `create_ip:${clientIp(req)}`, 20, 3600))
    ) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const b = await req.json();
    const phone = digits10(b.phone);
    if (!/^\d{10}$/.test(phone)) return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 });
    if (!checkProof(b.proof, phone, user.id)) {
      return NextResponse.json({ error: 'Phone verification expired. Please verify your phone number again.' }, { status: 403 });
    }

    const name = str(b.name, 80);
    if (!name || name.length < 2) return NextResponse.json({ error: 'Please enter a valid name' }, { status: 400 });
    if (!SERVICES.includes(b.service)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });

    const qualification = str(b.qualification, 200);
    const about = str(b.about, 1000);
    const area = str(b.area, 120);
    const note = str(b.note, 300);
    const mapsLink = str(b.mapsLink, 500);
    if ([qualification, about, area, note, mapsLink].includes(undefined)) {
      return NextResponse.json({ error: 'One of the fields is too long' }, { status: 400 });
    }
    if (mapsLink && !/^https?:\/\//i.test(mapsLink)) return NextResponse.json({ error: 'Invalid map link' }, { status: 400 });

    const pincode = b.pincode ? String(b.pincode).trim() : null;
    if (pincode && !/^\d{6}$/.test(pincode)) return NextResponse.json({ error: 'Pincode must be 6 digits' }, { status: 400 });

    const experience = b.experience ? String(b.experience).trim() : null;
    if (experience && !/^\d{1,2} (Years|Months)$/.test(experience)) {
      return NextResponse.json({ error: 'Invalid experience' }, { status: 400 });
    }

    const bannerPosition = b.banner_position ? String(b.banner_position) : 'center';
    if (!/^center( \d{1,3}%)?$/.test(bannerPosition)) return NextResponse.json({ error: 'Invalid banner position' }, { status: 400 });
    if (!storageUrlOk(b.photo_url) || !storageUrlOk(b.banner_url)) {
      return NextResponse.json({ error: 'Invalid photo' }, { status: 400 });
    }

    const city = await ensureCity(admin, b.city, b.state);
    if (city.error) return NextResponse.json({ error: city.error }, { status: 400 });

    const manageToken = crypto.randomUUID();
    const { data, error } = await admin
      .from('listings')
      .insert({
        city_id: city.id,
        name,
        service: b.service,
        qualification,
        experience,
        about,
        phone,
        area,
        note,
        photo_url: b.photo_url || null,
        banner_url: b.banner_url || null,
        banner_position: bannerPosition,
        maps_link: mapsLink,
        pincode,
        // Server ki apni values — client ki nahi:
        phone_verified: true,
        verified: false,
        is_active: false,
        trial_ends_at: new Date().toISOString(),
        manage_token: manageToken,
        owner_id: user.id,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: 'Could not create listing. Please try again.' }, { status: 500 });

    return NextResponse.json({ id: data.id, manage_token: manageToken });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
