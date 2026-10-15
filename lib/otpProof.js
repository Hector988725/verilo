// Server-signed proof that "this logged-in user verified this phone number".
// Browser kabhi phone_verified khud set nahi karta — sirf ye proof /api/listing/create ko deta hai.
// Env var: OTP_PROOF_SECRET (koi bhi lambi random string, kam se kam 16 characters).
import crypto from 'crypto';

const TTL_MS = 15 * 60 * 1000; // proof 15 minute tak valid

function secret() {
  const s = process.env.OTP_PROOF_SECRET;
  if (!s || s.length < 16) throw new Error('OTP_PROOF_SECRET is not configured');
  return s;
}

export function digits10(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
}

function sign(phone, uid, exp) {
  return crypto.createHmac('sha256', secret()).update(`${digits10(phone)}.${uid}.${exp}`).digest('base64url');
}

export function makeProof(phone, uid, now = Date.now()) {
  const exp = now + TTL_MS;
  return `${exp}.${sign(phone, uid, exp)}`;
}

export function checkProof(proof, phone, uid, now = Date.now()) {
  if (typeof proof !== 'string' || !phone || !uid) return false;
  const [expStr, sig] = proof.split('.');
  const exp = Number(expStr);
  if (!exp || !sig || exp < now) return false;
  const expected = sign(phone, uid, exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
