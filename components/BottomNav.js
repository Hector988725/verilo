'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

function HomeIcon(active) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" />
    </svg>
  );
}
function HeartIcon(active) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5s-7.5-4.6-9.7-9C.7 8 2 4.5 5.4 4c2-.3 3.8.6 4.6 2.1C10.8 4.6 12.6 3.7 14.6 4c3.4.5 4.7 4 3.1 7.5-2.2 4.4-9.7 9-9.7 9Z" />
    </svg>
  );
}
function BookingIcon(active) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 9.5h16M8 3v3.5M16 3v3.5" />
    </svg>
  );
}
function ProfileIcon(active) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hidden on admin screens — this nav is for customers browsing/managing their account.
  if (pathname?.startsWith('/admin')) return null;

  const items = [
    { href: '/', label: 'Home', icon: HomeIcon, match: (p) => p === '/' || p.startsWith('/city') && !p.includes('/saved') },
    { href: '/saved', label: 'Saved', icon: HeartIcon, match: (p) => p.startsWith('/saved') },
    { href: '/bookings', label: 'Bookings', icon: BookingIcon, match: (p) => p.startsWith('/bookings') },
    { href: '/profile', label: 'Profile', icon: ProfileIcon, match: (p) => p.startsWith('/profile') },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--paper)', borderTop: '1px solid var(--line)',
      display: 'flex', justifyContent: 'space-around', padding: '8px 4px calc(env(safe-area-inset-bottom, 0px) + 6px)',
      boxShadow: '0 -6px 18px rgba(90,68,30,0.08)',
    }}>
      {items.map((item) => {
        const active = item.match(pathname || '');
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: active ? 'var(--vermillion)' : 'var(--muted)', textDecoration: 'none',
              fontSize: 10.5, fontWeight: 600, flex: 1, padding: '4px 0',
            }}
          >
            {item.icon(active)}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
