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
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Last updated: November 2026</p>

        <p>Verilo is operated by Hector365 ("we", "us", "our"). This policy explains what information we collect and how we use it.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Information We Collect</h4>
        <p>When you create a listing, we collect your name, phone number, service category, area, and any photo, description, or details you choose to add. When you make a payment, Razorpay (our payment processor) handles your payment details directly — we do not store your card, UPI, or bank information.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>How We Use It</h4>
        <p>Your listing information is shown publicly on Verilo so customers can find and contact you. Your phone number is used to verify ownership of your listing and to send you service-related communication. We do not sell your information to third parties.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Verification & Notifications</h4>
        <p>We may verify your phone number with a one-time password (OTP). If you allow push notifications, a device notification token is stored so we can send listing, payment-reminder and account alerts; you can turn this off in your browser or device settings.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Where Data Is Stored</h4>
        <p>Data is stored with third-party cloud providers (Supabase for database and storage, Cloudflare for hosting). Payments are handled by Razorpay. These providers may process data on servers in India or other countries under their own security standards.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Cookies & Local Storage</h4>
        <p>We use browser local storage only to keep you signed in, remember your language/city and make the app work smoothly as an installed app (PWA). We do not use it to show third-party ads.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Ratings & Reviews</h4>
        <p>Customers can leave ratings and written reviews on your public listing. These are visible to anyone viewing your profile.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Data Retention & Deletion</h4>
        <p>You can permanently delete your own listing at any time from your listing's management page. This removes your listing and associated data from public view.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Your Rights & Complaints</h4>
        <p>You can ask us to correct or delete your information by writing to us. We acknowledge complaints within 48 hours and aim to resolve them within 30 days.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Children</h4>
        <p>Verilo is meant for adults. We do not knowingly collect information from children.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Contact</h4>
        <p>For any privacy-related questions, contact us at <a href="mailto:officialhector365@gmail.com" style={{ color: '#8C6224' }}>officialhector365@gmail.com</a> or <a href="tel:+918959992195" style={{ color: '#8C6224' }}>+91 89599 92195</a>.</p>
      </div>
    </div>
  );
}
