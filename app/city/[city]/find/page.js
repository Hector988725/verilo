'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// This used to let anyone "recover" a listing by typing in its phone number —
// but phone numbers are public (shown on the Call button), so that let a
// stranger claim someone else's listing. Recovery now goes through a human
// (the Verilo owner) via WhatsApp, who can verify the person before sharing
// their real secret manage link.
export default function FindListingPage() {
  const params = useParams();
  const city = decodeURIComponent(params.city);

  const supportPhone = '918959992195';
  const message = encodeURIComponent(
    `Hi, I added my listing on Verilo (${city}) but lost my management link. My registered phone number is: `
  );

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href={`/city/${encodeURIComponent(city)}`} className="back-link">← Back to {city} listings</Link>
      </header>

      <div className="form-card">
        <h2 style={{ fontFamily: "'Rozha One', serif", color: '#C97F1E', marginTop: 0 }}>
          Lost Access to Your Listing?
        </h2>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          When you first added your listing, we gave you a private link to manage it — pay,
          edit, or pause it. If you saved that link (or you're on the same phone/browser you
          used to add it), just open it directly.
        </p>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          If you've lost that link, message us on WhatsApp with your registered phone number
          and we'll verify and send it back to you.
        </p>
        <a
          href={`https://wa.me/${supportPhone}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          💬 Message Support on WhatsApp
        </a>
      </div>
    </div>
  );
}
