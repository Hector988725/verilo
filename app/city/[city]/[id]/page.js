'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { catLabel, initials } from '../../../../lib/categories';

// PUBLIC PROFILE PAGE — anyone can view this (customers browsing Verilo).
// It NEVER shows owner controls (pay, pause, edit, availability toggle).
// Those live only on the separate /manage page, reachable via phone verification.
export default function ProfilePage() {
  const params = useParams();
  const city = decodeURIComponent(params.city);
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [starValue, setStarValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  if (!listing) return <div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>;

  return (
    <div className="wrap">
      <Link href={`/city/${encodeURIComponent(city)}`} className="back-link">← Back to list</Link>

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
        <p style={{ marginTop: 6, fontSize: 13.5, fontWeight: 700, color: listing.is_available === false ? '#C1442E' : '#2E6B4E' }}>
          {listing.is_available === false ? '🔴 Not available right now' : '🟢 Available now'}
        </p>
        {listing.is_available === false && listing.unavailable_note && (
          <p style={{ fontSize: 12.5, color: '#8A94A6', marginTop: 2 }}>{listing.unavailable_note}</p>
        )}
      </div>

      <a className="profile-call" href={`tel:${listing.phone}`}>📞 Call Now</a>

      {listing.about && (
        <div className="profile-card"><h3>About</h3><p>{listing.about}</p></div>
      )}
      {listing.note && (
        <div className="profile-card"><h3>Note</h3><p>{listing.note}</p></div>
      )}

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
