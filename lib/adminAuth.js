import { cookies } from 'next/headers';

export function isAdminAuthenticated() {
  const cookie = cookies().get('verilo_admin');
  return !!(cookie && cookie.value === process.env.ADMIN_PASSCODE);
}
