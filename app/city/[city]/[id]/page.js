'use client';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '../../../../lib/supabaseClient';
import { catLabel, initials, isInTrial, daysLeft } from '../../../../lib/categories';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  const city = decodeURIComponent(params.city);
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [starValue, setStarValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [payingNow, setPayingNow] = useState(false);

  async function load() {
    const { data: listingData } = await supabase.from('listings').select('*').eq('id', id).single();
    setListing(listingData);
    const { data: ratingData } = await supabase.from('ratings').select('*').eq('listing_id', id).order('created_at', { ascending: false });
    setRatings(ratingData || []);
  }

  useEffect(() => { load(); }, [id]);

  const avg = ratings.length ? ratings.reduce((a, r) => a + r.stars, 0) / ratings.length : null;

  async function submitRating() {
    if (!starValue) { alert('Please select a star rating first.'); return; }
    setSubmittingReview(true);
    await supabase.from('ratings').insert({ listing_id: id, stars: starValue, review_text: reviewText.trim() || null });
    setStarValue(0);
    setReviewText('');
    setSubmittingReview(false);
    load();
  }

  async function reportListing() {
    const reason = prompt('Briefly describe the issue with this listing:');
    if (!reason) return;
    await supabase.from('reports').insert({ listing_id: id, reason });
    alert('Thanks — we will review this listing.');
  }

  async function handlePayNow() {
    setPayingNow(true);
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id }),
      });
      const order = await res.json();
      if (!order.id) throw new Error(order.error || 'Could not create payment order');

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Verilo',
        description: 'Monthly listing fee',
        order_id: order.id,
        handler: async function (response) {
          await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, listing_id: id }),
          });
          alert('Payment successful! Your listing is active for another month.');
          load();
        },
        prefill: { contact: listing.phone },
        theme: { color: '#C1442E' },
      });
      rzp.open();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayingNow(false);
    }
  }

  if (!listing) return <div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>;

  const trial = isInTrial(listing);

  return (
    <div className="wrap">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Link href={`/city/${encodeURIComponent(city)}`} className="back-link">← Back to list</Link>

      {isWelcome && (
        <div className="profile-card" style={{ background: '#F3EEDD', border: '1.5px dashed #C97F1E' }}>
          <h3>🎉 Your listing is live!</h3>
          <p style={{ marginBottom: 8 }}>
            Bookmark this page or save this link — this is your profile. Come back here anytime
            to check your trial status or pay your monthly fee.
          </p>
          <p style={{ fontSize: 12.5, color: '#6B7280' }}>
            Forgot to save the link? Just search "Manage my listing" on the {city} page with
            your phone number.
          </p>
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar">
          {listing.photo_url ? <img src={listing.photo_url} alt="" /> : initials(listing.name)}
        </div>
        <h2 className="profile-name">{listing.name}</h2>
        <div className="profile-service">{catLabel(listing.service)}</div>
        {listing.verified && <p className="profile-meta">✓ Verified by Verilo</p>}
        {listing.qualification && <p className="profile-meta">🏷️ {listing.qualification}</p>}
        {listing.experience && <p className="profile-meta">💼 {listing.experience} experience</p>}
        {listing.area && <p className="profile-meta">📍 {listing.area}</p>}
        <p className="profile-rating">
          {avg ? `★ ${avg.toFixed(1)} (${ratings.length} rating${ratings.length > 1 ? 's' : ''})` : 'No ratings yet — be the first'}
        </p>
      </div>

      <a className="profile-call" href={`tel:${listing.phone}`}>📞 Call Now</a>

      {listing.about && (
        <div className="profile-card"><h3>About</h3><p>{listing.about}</p></div>
      )}
      {listing.note && (
        <div className="profile-card"><h3>Note</h3><p>{listing.note}</p></div>
      )}

      <div className="profile-card">
        <h3>{trial ? `Free trial — ${daysLeft(listing)} days left` : 'Monthly fee due'}</h3>
        <p style={{ marginBottom: 12 }}>
          {trial
            ? 'Your listing is free until the trial ends. Pay anytime to lock in your spot after that.'
            : 'Your free trial has ended. Pay ₹30 to keep this listing active for another month.'}
        </p>
        <button className="btn-primary" onClick={handlePayNow} disabled={payingNow} style={{ marginTop: 0 }}>
          {payingNow ? 'Opening payment...' : 'Pay ₹30 for this month'}
        </button>
      </div>

      <div className="profile-card">
        <h3>Rate this listing</h3>
        <div style={{ display: 'flex', gap: 4, fontSize: 26, margin: '8px 0' }}>
          {[1, 2, 3, 4, 5].map((v) => (
            <span key={v} onClick={() => setStarValue(v)} style={{ cursor: 'pointer', color: v <= starValue ? '#E8A33D' : '#ddd6c4' }}>★</span>
          ))}
        </div>
        <textarea placeholder="Share your experience (optional)" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
        <button className="btn-primary" onClick={submitRating} disabled={submittingReview} style={{ marginTop: 12 }}>
          {submittingReview ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>

      <div className="profile-card">
        <h3>Reviews</h3>
        {ratings.length === 0 && <p style={{ color: '#6B7280', fontStyle: 'italic' }}>No reviews yet.</p>}
        {ratings.map((r) => (
          <div key={r.id} className="review-item">
            <div className="review-stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
            {r.review_text && <div>{r.review_text}</div>}
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: 20 }}>
        <span className="report-link" onClick={reportListing} style={{ cursor: 'pointer' }}>Report this listing</span>
      </p>
    </div>
  );
}
