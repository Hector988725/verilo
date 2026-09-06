import Link from 'next/link';

export const metadata = { title: 'Pricing & How It Works | Verilo' };

export default function PricingPage() {
  return (
    <div className="wrap" style={{ maxWidth: 700 }}>
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Trusted local professionals — all in one place</p>
        <Link href="/" className="back-link">← Back to home</Link>
      </header>

      <div className="profile-card">
        <h3>What Verilo Is</h3>
        <p>
          Verilo is a local service directory. Plumbers, electricians, doctors, tutors, tailors,
          and other service providers create a public profile listing their name, service,
          experience, area, and contact number. Customers browse by city and category, view
          ratings and reviews, and call the provider directly — Verilo does not take a cut of
          any service payment between the customer and provider.
        </p>
      </div>

      <div className="profile-card">
        <h3>Sample Listing</h3>
        <p style={{ marginBottom: 10 }}>
          Here's a live example of a public service-provider profile on Verilo, showing the
          service, description, location, and contact option a customer sees:
        </p>
        <a
          href="https://verilo-seven.vercel.app/city/anuppur/2f4cbeb2-07fe-4981-9507-d50e26761c1d"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#C97F1E', fontWeight: 700 }}
        >
          View a sample listing →
        </a>
      </div>

      <div className="profile-card">
        <h3>Listing Fee for Service Providers</h3>
        <p style={{ marginBottom: 14 }}>
          A listing goes live once a provider completes payment for one of these plans (paid
          via Razorpay):
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ background: '#F3EEDD', borderRadius: 10, padding: '12px 16px' }}>
            <strong>1 Month — ₹30</strong>
          </div>
          <div style={{ background: '#F3EEDD', borderRadius: 10, padding: '12px 16px' }}>
            <strong>6 Months — ₹150</strong> <span style={{ color: '#6B7280', fontSize: 13 }}>(1 month free)</span>
          </div>
          <div style={{ background: '#F3EEDD', borderRadius: 10, padding: '12px 16px' }}>
            <strong>12 Months — ₹300</strong> <span style={{ color: '#6B7280', fontSize: 13 }}>(2 months free)</span>
          </div>
        </div>
        <p style={{ marginTop: 14, fontSize: 13, color: '#6B7280' }}>
          Browsing listings and calling a provider is always free for customers. See our{' '}
          <Link href="/refund" style={{ color: '#C97F1E' }}>Refund & Cancellation Policy</Link>{' '}
          and <Link href="/terms" style={{ color: '#C97F1E' }}>Terms & Conditions</Link> for full details.
        </p>
      </div>

      <div className="profile-card">
        <h3>Business Details</h3>
        <p><strong>Operated by:</strong> Hector365</p>
        <p><strong>Address:</strong> 110/4 Chachai Abad, Ward No. 3, Amlai Road, 484116</p>
        <p><strong>Contact:</strong> <Link href="/contact" style={{ color: '#C97F1E' }}>See Contact Us page →</Link></p>
      </div>
    </div>
  );
}
