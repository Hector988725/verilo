import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { verifyOwnerToken } from '../../../../lib/verifyOwnerToken';
import { digits10 } from '../../../../lib/otpProof';
import { CATEGORIES } from '../../../../lib/categories';

const SERVICES = CATEGORIES.map((c) => c.key).filter((k) => k !== 'all');

// Only fields a professional should be able to edit themselves.
const ALLOWED_FIELDS = ['name', 'service', 'qualification', 'experience', 'about', 'phone', 'area', 'note', 'photo_url', 'banner_url', 'banner_position', 'maps_link', 'pincode', 'fb_url', 'instagram_url', 'youtube_url', 'gmb_url'];

const MAX_LEN = { name: 80, qualification: 200, about: 1000, area: 120, note: 300, maps_link: 500, fb_url: 300, instagram_url: 300, youtube_url: 300, gmb_url: 300 };
const URL_FIELDS = ['maps_link', 'fb_url', 'instagram_url', 'youtube_url', 'gmb_url'];

function storageUrlOk(u) {
  if (!u) return true;
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/`;
  return typeof u === 'string' && u.startsWith(base) && u.length < 600;
}

// Returns { value } (cleaned) or { error } for one field. Empty text becomes null.
function cleanField(key, raw) {
  const text = raw === undefined || raw === null ? '' : String(raw).trim();

  if (key === 'service') {
    return SERVICES.includes(raw) ? { value: raw } : { error: 'Invalid category' };
  }
  if (key === 'name') {
    if (text.length < 2) return { error: 'Please enter a valid name' };
    if (text.length > MAX_LEN.name) return { error: 'Name is too long' };
    return { value: text };
  }
  if (key === 'phone') {
    const p = digits10(text);
    return /^\d{10}$/.test(p) ? { value: p } : { error: 'Enter a valid 10-digit phone number' };
  }
  if (key === 'pincode') {
    if (!text) return { value: null };
    return /^\d{6}$/.test(text) ? { value: text } : { error: 'Pincode must be 6 digits' };
  }
  if (key === 'experience') {
    if (!text) return { value: null };
    return /^\d{1,2} (Years|Months)$/.test(text) ? { value: text } : { error: 'Invalid experience' };
  }
  if (key === 'banner_position') {
    if (!text) return { value: 'center' };
    return /^center( \d{1,3}%)?$/.test(text) ? { value: text } : { error: 'Invalid banner position' };
  }
  if (key === 'photo_url' || key === 'banner_url') {
    if (!text) return { value: null };
    return storageUrlOk(text) ? { value: text } : { error: 'Invalid photo' };
  }
  // Remaining fields are plain text, some of them links.
  if (!text) return { value: null };
  if (MAX_LEN[key] && text.length > MAX_LEN[key]) return { error: 'One of the fields is too long' };
  if (URL_FIELDS.includes(key) && !/^https?:\/\//i.test(text)) return { error: 'Links must start with http:// or https://' };
  return { value: text };
}

export async function POST(req) {
  try {
    const { listing_id, token, updates } = await req.json();
    const admin = supabaseAdmin();

    const ok = await verifyOwnerToken(admin, listing_id, token);
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const keys = ALLOWED_FIELDS.filter((k) => k in updates);
    if (keys.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    // Older listings may hold values saved before these checks existed (for example a link without https).
    // Only fields whose value actually CHANGES are checked, so saving unrelated edits never gets blocked by old data.
    const { data: current, error: currentError } = await admin
      .from('listings').select(keys.join(', ')).eq('id', listing_id).single();
    if (currentError || !current) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const safeUpdates = {};
    for (const key of keys) {
      const cleaned = cleanField(key, updates[key]);
      if (cleaned.error) {
        const sent = String(updates[key] ?? '').trim();
        const stored = String(current[key] ?? '').trim();
        if (sent === stored) continue; // unchanged legacy value: leave it alone
        return NextResponse.json({ error: cleaned.error }, { status: 400 });
      }
      safeUpdates[key] = cleaned.value;
    }

    // If the phone number is changing, the OTP verification no longer
    // applies to the new number — reset it so the Verified badge stays honest.
    if ('phone' in safeUpdates && current.phone !== safeUpdates.phone) {
      safeUpdates.phone_verified = false;
    }

    if (Object.keys(safeUpdates).length > 0) {
      const { error } = await admin.from('listings').update(safeUpdates).eq('id', listing_id);
      if (error) return NextResponse.json({ error: 'Could not save changes. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
