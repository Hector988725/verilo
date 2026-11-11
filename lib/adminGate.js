import { cookies } from 'next/headers';

// Admin cookie ka check (async: Next 15 me cookies() promise hai).
export async function adminOk() {
  const c = (await cookies()).get('verilo_admin');
  return !!(c && process.env.ADMIN_PASSCODE && c.value === process.env.ADMIN_PASSCODE);
}
