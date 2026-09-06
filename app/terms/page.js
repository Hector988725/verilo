import Link from 'next/link';

export const metadata = { title: 'Terms & Conditions | Verilo' };

export default function TermsPage() {
  return (
    <div className="wrap" style={{ maxWidth: 700 }}>
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href="/" className="back-link">← Back to home</Link>
      </header>

      <div className="profile-card">
        <h3>Terms & Conditions</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Last updated: September 2026</p>

        <p>Verilo is a local service directory operated by Hector365. By using Verilo, you agree to the following terms.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>What Verilo Is</h4>
        <p>Verilo is a directory that lets service providers (plumbers, electricians, doctors, tutors, and others) list their contact details for customers in their area to find them. Verilo does not employ, supervise, or take responsibility for the work performed by any listed provider.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Listings</h4>
        <p>Anyone adding a listing confirms that the information provided (name, phone number, service, and any other details) is accurate and belongs to them or their business. Verilo reserves the right to pause or remove any listing that is found to be false, misleading, spam, or in violation of these terms.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Fees & Listing Visibility</h4>
        <p>A listing becomes publicly visible only after the applicable listing fee has been paid. Fees are billed for a fixed period (1, 6, or 12 months) as selected at the time of payment. See our Refund & Cancellation Policy for details on cancellations.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Ratings & Reviews</h4>
        <p>Customers may leave star ratings and written reviews on listings. Reviews should reflect genuine experiences. Verilo may remove reviews that are abusive, fake, or unrelated to the service provided.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Limitation of Liability</h4>
        <p>Verilo is a directory only. We are not responsible for the quality, safety, legality, or outcome of any service arranged through contact information found on Verilo. Any dispute regarding a service is between the customer and the service provider directly.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Contact</h4>
        <p>Questions about these terms can be sent to <a href="mailto:officialhector365@gmail.com" style={{ color: '#C97F1E' }}>officialhector365@gmail.com</a> or <a href="tel:+918959992195" style={{ color: '#C97F1E' }}>+91 89599 92195</a>.</p>
      </div>
    </div>
  );
}
