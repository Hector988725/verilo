import Link from 'next/link';

export const metadata = { title: 'Privacy Policy | Verilo' };

export default function PrivacyPage() {
  return (
    <div className="wrap" style={{ maxWidth: 700 }}>
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href="/" className="back-link">← Back to home</Link>
      </header>

      <div className="profile-card">
        <h3>Privacy Policy</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Last updated: September 2026</p>

        <p>Verilo is operated by Hector365 ("we", "us", "our"). This policy explains what information we collect and how we use it.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Information We Collect</h4>
        <p>When you create a listing, we collect your name, phone number, service category, area, and any photo, description, or details you choose to add. When you make a payment, Razorpay (our payment processor) handles your payment details directly — we do not store your card, UPI, or bank information.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>How We Use It</h4>
        <p>Your listing information is shown publicly on Verilo so customers can find and contact you. Your phone number is used to verify ownership of your listing and to send you service-related communication. We do not sell your information to third parties.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Ratings & Reviews</h4>
        <p>Customers can leave ratings and written reviews on your public listing. These are visible to anyone viewing your profile.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Data Retention & Deletion</h4>
        <p>You can permanently delete your own listing at any time from your listing's management page. This removes your listing and associated data from public view.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Contact</h4>
        <p>For any privacy-related questions, contact us at <a href="mailto:officialhector365@gmail.com" style={{ color: '#C97F1E' }}>officialhector365@gmail.com</a> or <a href="tel:+918959992195" style={{ color: '#C97F1E' }}>+91 89599 92195</a>.</p>
      </div>
    </div>
  );
}
