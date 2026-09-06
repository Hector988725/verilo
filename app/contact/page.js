import Link from 'next/link';

export const metadata = { title: 'Contact Us | Verilo' };

export default function ContactPage() {
  return (
    <div className="wrap" style={{ maxWidth: 700 }}>
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href="/" className="back-link">← Back to home</Link>
      </header>

      <div className="profile-card">
        <h3>Contact Us</h3>
        <p><strong>Business Name:</strong> Hector365</p>
        <p><strong>Address:</strong> 110/4 Chachai Abad, Ward No. 3, Amlai Road, 484116</p>
        <p><strong>Support Email:</strong> <a href="mailto:officialhector365@gmail.com" style={{ color: '#C97F1E' }}>officialhector365@gmail.com</a></p>
        <p><strong>Support Phone:</strong> <a href="tel:+918959992195" style={{ color: '#C97F1E' }}>+91 89599 92195</a></p>
        <p style={{ marginTop: 12, fontSize: 13.5, color: '#6B7280' }}>
          For any questions about your listing, billing, or a payment issue, reach out to us
          using the details above and we'll get back to you as soon as possible.
        </p>
      </div>
    </div>
  );
}
