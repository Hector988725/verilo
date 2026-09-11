'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { catLabel, initials, catColor } from '../../../../lib/categories';
import { CategoryIcon } from '../../../../lib/categoryIcons';
import { useAuth } from '../../../../components/AuthProvider';

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

// PUBLIC PROFILE PAGE — anyone can view this (customers browsing Verilo).
// It NEVER shows owner controls (pay, pause, edit, availability toggle).
// Those live only on the separate /manage page, reachable via phone verification.
export default function ProfileClient() {
  const params = useParams();
  const city = decodeURIComponent(params.city);
  const id = params.id;
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [starValue, setStarValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [saved, setSaved] = useState(false);
  const [savedRowId, setSavedRowId] = useState(null);

  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [sendingEnquiry, setSendingEnquiry] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryErr, setEnquiryErr] = useState('');

  async function load() {
    const { data: listingData } = await supabase.from('listings').select('*').eq('id', id).single();
    setListing(listingData);
    const { data: ratingData } = await supabase.from('ratings').select('*').eq('listing_id', id).order('created_at', { ascending: false });
    setRatings(ratingData || []);
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!user) { setSaved(false); setSavedRowId(null); return; }
    setEnquiryName((n) => n || user.user_metadata?.full_name || '');
    supabase.from('saved_listings').select('id').eq('user_id', user.id).eq('listing_id', id).maybeSingle()
      .then(({ data }) => {
        setSaved(!!data);
        setSavedRowId(data?.id || null);
      });
  }, [user, id]);

  async function toggleSave() {
    if (!user) { alert('Please sign in (Profile tab) to save listings.'); return; }
    if (saved && savedRowId) {
      await supabase.from('saved_listings').delete().eq('id', savedRowId);
      setSaved(false);
      setSavedRowId(null);
    } else {
      const { data } = await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: id }).select().maybeSingle();
      setSaved(true);
      setSavedRowId(data?.id || null);
    }
  }

  async function sendEnquiry() {
    setEnquiryErr('');
    if (!user) { setEnquiryErr('Please sign in (Profile tab) first to send an enquiry.'); return; }
    if (!enquiryName.trim()) { setEnquiryErr('Please enter your name.'); return; }
    setSendingEnquiry(true);
    const { error } = await supabase.from('bookings').insert({
      listing_id: id,
      customer_id: user.id,
      customer_name: enquiryName.trim(),
      customer_phone: enquiryPhone.trim() || null,
      message: enquiryMsg.trim() || null,
    });
    setSendingEnquiry(false);
    if (error) { setEnquiryErr(error.message); return; }
    setEnquirySent(true);
    setEnquiryMsg('');
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href={`/city/${encodeURIComponent(city)}`} className="back-link" style={{ margin: 0 }}>← Back to list</Link>
        <button
          onClick={toggleSave}
          aria-label={saved ? 'Remove from saved' : 'Save listing'}
          style={{
            background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 999, width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: saved ? 'var(--vermillion)' : 'var(--muted)', boxShadow: 'var(--shadow)', marginBottom: 14,
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20.5s-7.5-4.6-9.7-9C.7 8 2 4.5 5.4 4c2-.3 3.8.6 4.6 2.1C10.8 4.6 12.6 3.7 14.6 4c3.4.5 4.7 4 3.1 7.5-2.2 4.4-9.7 9-9.7 9Z" />
          </svg>
        </button>
      </div>

      <div className="profile-banner">
        <span style={{
          display: 'inline-flex', width: 34, height: 34, borderRadius: 10, background: catColor(listing.service),
          alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--shadow)',
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
        <a className="profile-call" href={`tel:${listing.phone}`} style={{ flex: 1, marginBottom: 0 }}>📞 Call</a>
        {whatsappHref && (
          <a
            className="profile-call"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, marginBottom: 0, background: '#2E9E52', boxShadow: '0 8px 18px rgba(46,158,82,0.3)' }}
          >
            💬 Chat
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
        <h3>Send an Enquiry</h3>
        {enquirySent ? (
          <p style={{ color: '#2E6B4E', fontWeight: 600 }}>✓ Sent! Track it under the Bookings tab.</p>
        ) : (
          <>
            <label>Your Name</label>
            <input value={enquiryName} onChange={(e) => setEnquiryName(e.target.value)} placeholder="Your name" />
            <label>Your Phone (optional)</label>
            <input value={enquiryPhone} onChange={(e) => setEnquiryPhone(e.target.value)} placeholder="10-digit number" />
            <label>Message (optional)</label>
            <textarea value={enquiryMsg} onChange={(e) => setEnquiryMsg(e.target.value)} placeholder="What do you need help with?" />
            {enquiryErr && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{enquiryErr}</p>}
            <button className="btn-primary" onClick={sendEnquiry} disabled={sendingEnquiry}>
              {sendingEnquiry ? 'Sending...' : 'Send Enquiry'}
            </button>
          </>
        )}
      </div>

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
