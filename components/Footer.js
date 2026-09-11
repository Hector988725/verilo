'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';

export default function Footer() {
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  function handleSecretTap() {
    tapCountRef.current += 1;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000); // reset if taps are more than 2s apart

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      setShowAdminMenu(true);
    }
  }

  return (
    <footer style={{
      textAlign: 'center', padding: '20px 16px 90px', fontSize: 12, color: 'var(--muted)',
      borderTop: '1px solid var(--line)', marginTop: 20,
      position: 'relative', zIndex: 45, background: 'transparent',
    }}>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <Link href="/pricing" style={{ color: 'var(--muted)' }}>Pricing</Link>
        <Link href="/contact" style={{ color: 'var(--muted)' }}>Contact Us</Link>
        <Link href="/privacy" style={{ color: 'var(--muted)' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: 'var(--muted)' }}>Terms & Conditions</Link>
        <Link href="/refund" style={{ color: 'var(--muted)' }}>Refund Policy</Link>
      </div>
      <p
        style={{ margin: 0, userSelect: 'none' }}
        onClick={handleSecretTap}
      >
        © {new Date().getFullYear()} Hector365. All rights reserved.
      </p>

      {showAdminMenu && (
        <div
          onClick={() => setShowAdminMenu(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1B2430', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: '20px 24px', minWidth: 220,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <p style={{ color: '#E8A33D', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>
              Admin Panel
            </p>
            <Link
              href="/admin/due"
              onClick={() => setShowAdminMenu(false)}
              style={{
                color: '#fff', background: '#2A3441', padding: '10px 14px',
                borderRadius: 8, fontSize: 13.5, textDecoration: 'none',
              }}
            >
              📋 Due List / Reminders
            </Link>
            <Link
              href="/admin/reports"
              onClick={() => setShowAdminMenu(false)}
              style={{
                color: '#fff', background: '#2A3441', padding: '10px 14px',
                borderRadius: 8, fontSize: 13.5, textDecoration: 'none',
              }}
            >
              🚩 Reported Listings
            </Link>
            <p
              onClick={() => setShowAdminMenu(false)}
              style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 6, cursor: 'pointer' }}
            >
              Close
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}
