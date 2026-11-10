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
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Last updated: November 2026</p>

        <p>This policy applies to listing fees paid on Verilo (₹30 for 1 month, ₹150 for 6 months, ₹300 for 12 months, or the optional Monthly AutoPay of ₹30/month).</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Refund Eligibility</h4>
        <p>If a payment is made in error, is duplicated, or your listing was not activated within 24 hours of a successful payment due to a technical issue on our end, you are eligible for a full refund. Please contact us with your payment details within 7 days of the transaction.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Non-Refundable Cases</h4>
        <p>Once a listing has been active and visible to customers for any part of the paid period, that period is non-refundable — this includes cases where you choose to pause, mark yourself unavailable, or delete your listing partway through a paid term.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Cancellation (One-Time Plans)</h4>
        <p>One-time plans (1, 6 or 12 months) do not renew automatically — each payment covers a fixed period only. To stop paying, simply don’t renew; your listing stops being publicly visible after the period ends. You may also permanently delete your listing yourself at any time from its management page.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Monthly AutoPay</h4>
        <p>AutoPay is optional. If you choose it, ₹30 is debited automatically every month through Razorpay (UPI AutoPay) until you cancel. You can cancel anytime from your listing’s management page or provider dashboard; cancelling stops the next debit and your listing stays active until the period you already paid for ends. If you were debited after cancelling, or debited by mistake, contact us within 7 days and we will refund it after verification.</p>

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>How to Request a Refund</h4>
        <p>Email <a href="mailto:officialhector365@gmail.com" style={{ color: '#8C6224' }}>officialhector365@gmail.com</a> or call <a href="tel:+918959992195" style={{ color: '#8C6224' }}>+91 89599 92195</a> with your registered phone number and payment date. Approved refunds are processed to the original payment method within 5-7 business days via Razorpay.</p>
      </div>
    </div>
  );
}
