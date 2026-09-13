'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { catLabel, initials, catColor } from '../../../../lib/categories';
import { CategoryIcon } from '../../../../lib/categoryIcons';

function WhatsAppIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5c-5.25 0-9.5 4.25-9.5 9.5 0 1.68.44 3.26 1.2 4.63L2.5 21.5l4.99-1.17A9.44 9.44 0 0 0 12 21.5c5.25 0 9.5-4.25 9.5-9.5S17.25 2.5 12 2.5Zm0 17.2c-1.5 0-2.9-.4-4.1-1.1l-.29-.17-2.96.7.7-2.88-.19-.3A7.7 7.7 0 0 1 4.3 12c0-4.25 3.45-7.7 7.7-7.7s7.7 3.45 7.7 7.7-3.45 7.7-7.7 7.7Zm4.22-5.77c-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.52.12-.15.23-.6.75-.73.9-.13.15-.27.17-.5.06-.23-.12-.96-.35-1.83-1.13-.68-.6-1.13-1.35-1.27-1.58-.13-.23-.01-.35.1-.47.11-.11.23-.27.35-.4.12-.14.15-.23.23-.39.08-.15.04-.29-.02-.4-.06-.12-.52-1.26-.72-1.72-.19-.46-.38-.4-.52-.4h-.44c-.15 0-.4.06-.6.29-.21.23-.79.77-.79 1.88s.81 2.19.92 2.34c.12.15 1.6 2.44 3.87 3.42.54.23.96.37 1.29.48.54.17 1.04.15 1.43.09.44-.07 1.36-.55 1.55-1.09.19-.54.19-1 .13-1.09-.06-.1-.21-.16-.44-.27Z" />
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function TagIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12 12 3h7v7l-9 9-7-7Z" />
      <circle cx="15.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function StarIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9 6.1 20.2l1.3-6.5-4.9-4.5 6.6-.7L12 2.5Z" />
    </svg>
  );
}

// PUBLIC PROFILE PAGE — anyone can view this, no login. It NEVER shows owner
// controls (pay, pause, edit, availability toggle) — those live only on the
// separate /manage page, reachable only via the provider's private link/login.
export default function ProfileClient() {
  const params = useParams();
  const city = decodeURIComponent(params.city);
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [starValue, setStarValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  async function load() {
    // Explicit column list — this is a public page, so never select('*'),
    // which would also hand back manage_token (the listing's private key).
    const { data: listingData } = await supabase
      .from('listings')
      .select('id, name, service, phone, area, pincode, qualification, experience, about, note, photo_url, banner_url, verified, is_available, unavailable_note, maps_link')
      .eq('id', id)
      .single();
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

  if (!listing) return <div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>;

  const stats = [];
  stats.push({ icon: <StarIcon />, label: 'Rating', value: avg ? `${avg.toFixed(1)} (${ratings.length})` : 'New' });
  stats.push({
    icon: <ClockIcon />, label: 'Availability',
    value: listing.is_available === false ? 'Not available' : 'Available now',
  });
  if (listing.experience) stats.push({ icon: <TagIcon />, label: 'Experience', value: `${listing.experience}` });
  if (listing.qualification) stats.push({ icon: <TagIcon />, label: 'Speciality', value: listing.qualification });

  const whatsappHref = listing.phone
    ? `https://wa.me/91${listing.phone}?text=${encodeURIComponent(`Hi, I found your listing "${listing.name}" on Verilo and wanted to enquire.`)}`
    : null;

  return (
    <div className="wrap">
      <Link href={`/city/${encodeURIComponent(city)}`} className="back-link">← Back to list</Link>

      <div
        className="profile-banner"
        style={listing.banner_url ? {
          backgroundImage: `url(${listing.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
          border: 'none',
        } : undefined}
      >
        <span style={{
          display: 'inline-flex', width: 34, height: 34, borderRadius: 10,
          background: listing.banner_url ? 'rgba(255,255,255,0.9)' : catColor(listing.service),
          alignItems: 'center', justifyContent: 'center',
          color: listing.banner_url ? catColor(listing.service) : '#fff', boxShadow: 'var(--shadow)',
        }}>
          <CategoryIcon name={listing.service} width={18} height={18} />
        </span>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          {listing.photo_url ? <img src={listing.photo_url} alt="" /> : initials(listing.name)}
        </div>
        <h2 className="profile-name">{listing.name}</h2>
        <div className="profile-service" style={{ background: catColor(listing.service), color: '#fff' }}>{catLabel(listing.service)}</div>
        {listing.verified && <p className="profile-meta">✓ Verified by Verilo</p>}
        {listing.area && <p className="profile-meta">📍 {listing.area}{listing.pincode ? ` - ${listing.pincode}` : ''}</p>}
        {listing.is_available === false && listing.unavailable_note && (
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{listing.unavailable_note}</p>
        )}
      </div>

      <div className="stat-row">
        {stats.map((s, i) => (
          <div className="stat-pill" key={i}>
            <div className="stat-pill-icon">{s.icon}</div>
            <div className="stat-pill-label">{s.label}</div>
            <div className="stat-pill-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <a className="profile-call" href={`tel:${listing.phone}`} style={{ flex: 1, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <span style={{ fontSize: 15 }}>📞</span> Call
        </a>
        {whatsappHref && (
          <a
            className="profile-call"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, marginBottom: 0, background: '#25D366', boxShadow: '0 8px 18px rgba(37,211,102,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <WhatsAppIcon /> WhatsApp
          </a>
        )}
      </div>

      {listing.maps_link && (
        <a
          href={listing.maps_link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center', color: 'var(--muted)', fontSize: 13, margin: '10px 0 16px',
            textDecoration: 'underline',
          }}
        >
          📍 View on Google Maps
        </a>
      )}

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
            <span key={v} onClick={() => setStarValue(v)} style={{ cursor: 'pointer', color: v <= starValue ? 'var(--marigold-deep)' : '#E4D9BF' }}>★</span>
          ))}
        </div>
        <textarea placeholder="Share your experience (optional)" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
        <button className="btn-primary" onClick={submitRating} disabled={submittingReview} style={{ marginTop: 12 }}>
          {submittingReview ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>

      <div className="profile-card">
        <h3>Reviews</h3>
        {ratings.length === 0 && <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No reviews yet.</p>}
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
