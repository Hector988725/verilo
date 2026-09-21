'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { catLabel, catColor, catReviewPrompt } from '../../../../lib/categories';
import { CategoryIcon } from '../../../../lib/categoryIcons';
import { useAuth } from '../../../../components/AuthProvider';

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
  const router = useRouter();
  const city = decodeURIComponent(params.city);
  const id = params.id;
  const { user, signIn, signUp } = useAuth();

  const [listing, setListing] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [myRating, setMyRating] = useState(null); // this user's own existing review, if any
  const [starValue, setStarValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewErr, setReviewErr] = useState('');

  const [wantsToReview, setWantsToReview] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authShowPass, setAuthShowPass] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  async function load() {
    // Explicit column list — this is a public page, so never select('*'),
    // which would also hand back manage_token (the listing's private key).
    const { data: listingData } = await supabase
      .from('listings')
      .select('id, name, service, phone, area, pincode, qualification, experience, about, note, photo_url, banner_url, verified, is_available, unavailable_note, maps_link, fb_url, instagram_url, youtube_url, gmb_url')
      .eq('id', id)
      .single();
    setListing(listingData);
    const { data: ratingData } = await supabase.from('ratings').select('*').eq('listing_id', id).order('created_at', { ascending: false });
    setRatings(ratingData || []);
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!user) { setMyRating(null); return; }
    setReviewerName((n) => n || user.user_metadata?.full_name || '');
    supabase.from('ratings').select('*').eq('listing_id', id).eq('customer_id', user.id).maybeSingle()
      .then(({ data }) => setMyRating(data || null));
  }, [user, id]);

  const avg = ratings.length ? ratings.reduce((a, r) => a + r.stars, 0) / ratings.length : null;

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthErr('');
    setAuthInfo('');
    if (!authEmail.trim() || !authPassword) { setAuthErr('Please fill in email and password.'); return; }
    if (authMode === 'signup' && !authName.trim()) { setAuthErr('Please enter your name.'); return; }

    setAuthBusy(true);
    if (authMode === 'signup') {
      const { error } = await signUp(authName.trim(), authEmail.trim(), authPassword);
      if (error) setAuthErr(error.message);
      else setAuthInfo('Account created! Check your email to confirm, then sign in below.');
    } else {
      const { error } = await signIn(authEmail.trim(), authPassword);
      if (error) setAuthErr(error.message);
    }
    setAuthBusy(false);
  }

  async function submitRating() {
    if (!starValue) { setReviewErr('Please select a star rating first.'); return; }
    if (!reviewerName.trim()) { setReviewErr('Please enter your name.'); return; }
    setReviewErr('');
    setSubmittingReview(true);
    const { error } = await supabase.from('ratings').insert({
      listing_id: id, customer_id: user.id, stars: starValue, review_text: reviewText.trim() || null,
      reviewer_name: reviewerName.trim(),
    });
    setSubmittingReview(false);
    if (error) { setReviewErr(error.message); return; }
    setStarValue(0);
    setReviewText('');
    setWantsToReview(false);
    load();
  }

  async function reportListing() {
    const reason = prompt('Briefly describe the issue with this listing:');
    if (!reason) return;
    await supabase.from('reports').insert({ listing_id: id, reason });
    alert('Thanks — we will review this listing.');
  }

  if (!listing) return <div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>;

  const whatsappHref = listing.phone
    ? `https://wa.me/91${listing.phone}?text=${encodeURIComponent(`Hi, I found your listing "${listing.name}" on Verilo and wanted to enquire.`)}`
    : null;

  async function shareListing() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = { title: `${listing.name} — Verilo`, text: `Check out ${listing.name} (${catLabel(listing.service)}) on Verilo`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied! You can now paste and share it.');
      } catch (e) {
        prompt('Copy this link to share:', url);
      }
    }
  }

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Link href={`/city/${encodeURIComponent(city)}`} onClick={(e) => { e.preventDefault(); router.replace(`/city/${encodeURIComponent(city)}`); }} className="back-link" style={{ margin: 0 }}>← Back to list</Link>
        <button
          onClick={shareListing}
          aria-label="Share this listing"
          style={{
            background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 999, width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--muted)', boxShadow: 'var(--shadow)', marginBottom: 14,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="2.8" /><circle cx="6" cy="12" r="2.8" /><circle cx="18" cy="19" r="2.8" />
            <path d="M8.4 10.7 15.6 6.6M8.4 13.3l7.2 4.1" />
          </svg>
        </button>
      </div>

      {(listing.banner_url || listing.photo_url) && (
        <div
          className="profile-banner"
          style={{
            borderRadius: 16, aspectRatio: '16 / 9', width: '100%', height: 'auto',
            position: 'relative', overflow: 'hidden', border: 'none',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${listing.banner_url || listing.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <span style={{
            position: 'absolute', top: 14, right: 14,
            display: 'inline-flex', width: 34, height: 34, borderRadius: 10,
            background: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
            color: catColor(listing.service), boxShadow: 'var(--shadow)',
          }}>
            <CategoryIcon name={listing.service} width={18} height={18} />
          </span>
          {listing.verified && (
            <span style={{
              position: 'absolute', top: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.94)', color: 'var(--verified)', fontSize: 12, fontWeight: 700,
              padding: '4px 10px', borderRadius: 999, boxShadow: 'var(--shadow)',
            }}>
              ✓ Verified
            </span>
          )}
        </div>
      )}

      <div style={{ marginTop: 14, marginBottom: 6 }}>
        <h2 className="profile-name">{listing.name}</h2>
        <div className="profile-service" style={{ background: catColor(listing.service), color: '#fff' }}>{catLabel(listing.service)}</div>
        <p className="profile-meta" style={{ color: 'var(--star)', fontWeight: 700, display: 'inline-block', marginRight: 12 }}>
          ★ {avg ? `${avg.toFixed(1)} (${ratings.length})` : 'New — no ratings yet'}
        </p>
        <p className="profile-meta" style={{ color: listing.is_available === false ? 'var(--vermillion)' : '#1F6F52', fontWeight: 700, display: 'inline-block' }}>
          {listing.is_available === false ? '🔴 Not available now' : '🟢 Available now'}
        </p>
        {listing.area && <p className="profile-meta" style={{ color: 'var(--ink)', fontWeight: 500 }}>📍 {listing.area}{listing.pincode ? ` - ${listing.pincode}` : ''}</p>}
        {listing.experience && (
          <p className="profile-meta" style={{ color: 'var(--ink)', fontWeight: 500 }}>
            🏷️ {listing.experience}{/^\d+\s+(years?|months?|days?)$/i.test(listing.experience.trim()) ? ' experience' : ''}
          </p>
        )}
        {listing.about && (
          <p className="profile-meta" style={{ fontStyle: 'italic', color: 'var(--ink)', fontWeight: 500, lineHeight: 1.5 }}>
            {listing.about.length > 90 && !aboutExpanded ? listing.about.slice(0, 90) + '… ' : listing.about + ' '}
            {listing.about.length > 90 && (
              <span onClick={() => setAboutExpanded((e) => !e)} style={{ color: 'var(--brand-green)', fontWeight: 700, fontStyle: 'normal', cursor: 'pointer' }}>
                {aboutExpanded ? 'Show less' : 'Read more'}
              </span>
            )}
          </p>
        )}
      </div>
      {listing.is_available === false && listing.unavailable_note && (
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: -10, marginBottom: 14 }}>{listing.unavailable_note}</p>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
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

      {listing.qualification && (
        <div style={{ marginBottom: 14 }}>
          {listing.qualification.split(',').map((s, i) => s.trim() && (
            <span key={i} className="service-pill">{s.trim()}</span>
          ))}
        </div>
      )}

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

      {(listing.fb_url || listing.instagram_url || listing.youtube_url || listing.gmb_url) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '10px 0 16px' }}>
          {listing.fb_url && (
            <a href={listing.fb_url} target="_blank" rel="noopener noreferrer" title="Facebook" style={{ width: 38, height: 38, borderRadius: '50%', background: '#1877F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>f</a>
          )}
          {listing.instagram_url && (
            <a href={listing.instagram_url} target="_blank" rel="noopener noreferrer" title="Instagram" style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📷</a>
          )}
          {listing.youtube_url && (
            <a href={listing.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube" style={{ width: 38, height: 38, borderRadius: '50%', background: '#FF0000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>▶</a>
          )}
          {listing.gmb_url && (
            <a href={listing.gmb_url} target="_blank" rel="noopener noreferrer" title="Google Business Profile" style={{ width: 38, height: 38, borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>G</a>
          )}
        </div>
      )}

      <div className="profile-panel">
        {listing.note && (
          <div className="profile-section"><h3>Note</h3><p style={{ margin: 0 }}>{listing.note}</p></div>
        )}

        <div className="profile-section">
          <h3>Used their service? Rate it</h3>

          {myRating ? (
            <div>
              <div style={{ color: 'var(--star)', fontSize: 18, marginBottom: 4 }}>
                {'★'.repeat(myRating.stars)}{'☆'.repeat(5 - myRating.stars)}
              </div>
              {myRating.review_text && <p style={{ margin: 0, fontStyle: 'italic' }}>"{myRating.review_text}"</p>}
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>You've already reviewed this listing. Thanks!</p>
            </div>
          ) : !user ? (
            wantsToReview ? (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button type="button" className={'tab' + (authMode === 'signin' ? ' active' : '')} onClick={() => { setAuthMode('signin'); setAuthErr(''); setAuthInfo(''); }} style={{ flex: 1, textAlign: 'center' }}>Sign In</button>
                  <button type="button" className={'tab' + (authMode === 'signup' ? ' active' : '')} onClick={() => { setAuthMode('signup'); setAuthErr(''); setAuthInfo(''); }} style={{ flex: 1, textAlign: 'center' }}>Create Account</button>
                </div>
                <form onSubmit={handleAuthSubmit}>
                  {authMode === 'signup' && (
                    <>
                      <label>Your Name</label>
                      <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" />
                    </>
                  )}
                  <label>Email</label>
                  <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={authShowPass ? 'text' : 'password'}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setAuthShowPass((s) => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', padding: 4 }}>
                      {authShowPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {authErr && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{authErr}</p>}
                  {authInfo && <p style={{ color: 'var(--verified)', fontSize: 13, marginTop: 8 }}>{authInfo}</p>}
                  <button className="btn-primary" type="submit" disabled={authBusy}>
                    {authBusy ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In & Continue'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  Sign in to leave a rating — this keeps reviews genuine and spam-free. Browsing and calling never needs login.
                </p>
                <button className="btn-primary" onClick={() => setWantsToReview(true)} style={{ maxWidth: 240, margin: '0 auto' }}>
                  ⭐ Rate & Review
                </button>
              </div>
            )
          ) : wantsToReview ? (
            <>
              <label>Your Name</label>
              <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Shown with your review" />
              <div style={{ display: 'flex', gap: 4, fontSize: 26, margin: '8px 0' }}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <span key={v} onClick={() => setStarValue(v)} style={{ cursor: 'pointer', color: v <= starValue ? 'var(--star)' : '#E4D9BF' }}>★</span>
                ))}
              </div>
              <textarea placeholder={catReviewPrompt(listing.service)} value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
              {reviewErr && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{reviewErr}</p>}
              <button className="btn-primary" onClick={submitRating} disabled={submittingReview} style={{ marginTop: 12 }}>
                {submittingReview ? 'Submitting...' : 'Submit Rating'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <button className="btn-primary" onClick={() => setWantsToReview(true)} style={{ maxWidth: 240, margin: '0 auto' }}>
                ⭐ Rate & Review
              </button>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h3>Reviews</h3>
          {ratings.length === 0 && <p style={{ color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>No reviews yet.</p>}
          {ratings.map((r) => (
            <div key={r.id} className="review-item">
              {r.reviewer_name && (
                <div className="reviewer-row">
                  <span className="reviewer-avatar">{r.reviewer_name[0].toUpperCase()}</span>
                  <span className="reviewer-name">{r.reviewer_name}</span>
                  {r.created_at && (
                    <span className="reviewer-date">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
              )}
              <div className="review-stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
              {r.review_text && <div>{r.review_text}</div>}
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20 }}>
        <span className="report-link" onClick={reportListing} style={{ cursor: 'pointer' }}>Report this listing</span>
      </p>
    </div>
  );
}
