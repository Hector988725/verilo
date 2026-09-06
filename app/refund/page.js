import Link from 'next/link';

export const metadata = { title: 'Refund & Cancellation Policy | Verilo' };

export default function RefundPage() {
  return (
    <div className="wrap" style={{ maxWidth: 700 }}>
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href="/" className="back-link">← Back to home</Link>
      </header>

      <div className="profile-card">
        <h3>Refund & Cancellation Policy</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Last updated: September 2026</p>

        <p>This policy applies to listing fees paid on Verilo (₹30 for 1 month, ₹150 for 6 months, or ₹300 for 12 months).</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Refund Eligibility</h4>
        <p>If a payment is made in error, is duplicated, or your listing was not activated within 24 hours of a successful payment due to a technical issue on our end, you are eligible for a full refund. Please contact us with your payment details within 7 days of the transaction.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Non-Refundable Cases</h4>
        <p>Once a listing has been active and visible to customers for any part of the paid period, that period is non-refundable — this includes cases where you choose to pause, mark yourself unavailable, or delete your listing partway through a paid term.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Cancellation</h4>
        <p>There is no recurring auto-billing — each payment covers a fixed period only. To stop paying, simply don't renew when your period ends; your listing will stop being publicly visible after that date. You may also permanently delete your listing yourself at any time from its management page.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>How to Request a Refund</h4>
        <p>Email <a href="mailto:officialhector365@gmail.com" style={{ color: '#C97F1E' }}>officialhector365@gmail.com</a> or call <a href="tel:+918959992195" style={{ color: '#C97F1E' }}>+91 89599 92195</a> with your registered phone number and payment date. Approved refunds are processed to the original payment method within 5-7 business days via Razorpay.</p>
      </div>
    </div>
  );
}
