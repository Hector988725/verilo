import Link from 'next/link';

export default function Footer() {
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
      <p style={{ margin: 0 }}>
        © {new Date().getFullYear()} Hector365. All rights reserved.
      </p>

    </footer>
  );
}
