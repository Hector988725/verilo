import { INDIAN_STATES } from './indianStates';

export function cleanCityName(name) {
  const n = String(name || '').trim().replace(/\s+/g, ' ');
  if (n.length < 2 || n.length > 60) return null;
  if (!/^[\p{L}\p{M}0-9 .'()-]+$/u.test(n)) return null;
  return n;
}

export function cleanState(state) {
  const s = String(state || '').trim();
  if (!s) return null;
  return INDIAN_STATES.includes(s) ? s : undefined; // undefined = galat state
}

// Existing city dhoondo (case-insensitive, state ke saath); na mile to banao. Sirf server par (service role).
export async function ensureCity(admin, rawName, rawState) {
  const name = cleanCityName(rawName);
  if (!name) return { error: 'Invalid area name' };
  const state = cleanState(rawState);
  if (state === undefined) return { error: 'Invalid state' };

  async function find() {
    let q = admin.from('cities').select('id, state').ilike('name', name);
    if (state) q = q.eq('state', state);
    const { data } = await q.limit(1);
    return data && data[0] ? data[0] : null;
  }

  let row = await find();
  if (!row) {
    const { data, error } = await admin.from('cities').insert({ name, state }).select('id, state').single();
    if (error) {
      row = await find(); // doosre request ne abhi bana di ho sakti hai
      if (!row) return { error: 'Could not create area' };
    } else {
      row = data;
    }
  }
  return { id: row.id, state: row.state };
}
