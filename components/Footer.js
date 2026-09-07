import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center', padding: '20px 16px 90px', fontSize: 12, color: '#6B7280',
      borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 20,
      position: 'relative', zIndex: 45, background: '#1B2430',
    }}>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <Link href="/pricing" style={{ color: '#8A94A6' }}>Pricing</Link>
        <Link href="/contact" style={{ color: '#8A94A6' }}>Contact Us</Link>
        <Link href="/privacy" style={{ color: '#8A94A6' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#8A94A6' }}>Terms & Conditions</Link>
        <Link href="/refund" style={{ color: '#8A94A6' }}>Refund Policy</Link>
      </div>
      <p style={{ margin: 0 }}>© {new Date().getFullYear()} Hector365. All rights reserved.</p>
    </footer>
  );
}
