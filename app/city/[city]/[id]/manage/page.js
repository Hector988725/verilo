'use client';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '../../../../../lib/supabaseClient';
import { catLabel, initials } from '../../../../../lib/categories';
import { getMyToken, saveMyToken, forgetMyToken } from '../../../../../lib/ownership';

export default function ManageListingPage() {
  return (
    <Suspense fallback={<div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>}>
      <ManageContent />
    </Suspense>
  );
}

function ManageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  const city = decodeURIComponent(params.city);
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [payingNow, setPayingNow] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    checkAccess();
  }, [id]);

  async function checkAccess() {
    const tokenFromUrl = searchParams.get('t');

    const savedToken = getMyToken(id);
    if (savedToken) {
      setAllowed(true);
      load();
      return;
    }

    if (tokenFromUrl) {
      try {
        const res = await fetch('/api/verify-manage-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: id, token: tokenFromUrl }),
        });
        const result = await res.json();
        if (result.valid) {
          // Valid secret link — grant access and remember the actual token
          // on this device (not just the id), so future actions like edit,
          // delete, or availability changes can be verified server-side.
          saveMyToken(id, tokenFromUrl);
          setAllowed(true);
          load();
          return;
        }
      } catch (e) {}
    }

    setAllowed(false);
  }

  async function load() {
    const { data } = await supabase.from('listings').select('*').eq('id', id).single();
    setListing(data);
    loadBookings();
  }

  async function loadBookings() {
    try {
      const res = await fetch('/api/bookings/list-for-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id, token: getMyToken(id) }),
      });
      const result = await res.json();
      setBookings(result.bookings || []);
    } catch (e) {}
  }

  async function respondToBooking(bookingId, status) {
    setRespondingId(bookingId);
    await fetch('/api/bookings/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: id, token: getMyToken(id), booking_id: bookingId, status }),
    });
    setRespondingId(null);
    loadBookings();
  }

  async function toggleAvailability() {
    const goingAvailable = listing.is_available === false;
    let note = null;
    if (!goingAvailable) {
      note = prompt('Optional: when will you be available again? (e.g. "Back on Monday", "Available after 5 PM")') || null;
    }
    await fetch('/api/listing/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: id,
        token: getMyToken(id),
        is_available: goingAvailable,
        unavailable_note: goingAvailable ? null : note,
      }),
    });
    load();
  }

  const PLAN_LABELS = {
    1: { title: '1 Month', price: '₹30', note: null },
    6: { title: '6 Months', price: '₹150', note: 'Save ₹30 — 1 month free' },
    12: { title: '12 Months', price: '₹300', note: 'Save ₹60 — 2 months free' },
  };

  async function handlePayNow(months) {
    setPayingNow(true);
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id, months }),
      });
      const order = await res.json();
      if (!order.id) throw new Error(order.error || 'Could not create payment order');

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Verilo',
        description: `Listing fee — ${months} month${months > 1 ? 's' : ''}`,
        order_id: order.id,
        handler: async function (response) {
          await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, listing_id: id }),
          });
          setJustPaid(true);
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

  async function handleDelete() {
    const sure = confirm('This will permanently remove your listing from Verilo. This cannot be undone. Continue?');
    if (!sure) return;
    setDeleting(true);
    await fetch('/api/listing/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: id, token: getMyToken(id) }),
    });
    forgetMyToken(id);
    router.push(`/city/${encodeURIComponent(city)}`);
  }

  if (allowed === false) {
    return (
      <div className="wrap">
        <header><div className="pin"></div><h1>Verilo</h1></header>
        <div className="empty">
          <div className="empty-title">Access Not Verified</div>
          <div>
            This page can only be opened using your private management link, or from the
            device that originally added the listing.{' '}
            <Link href={`/city/${encodeURIComponent(city)}/find`} style={{ color: '#E8A33D' }}>
              Lost your link? →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (allowed === null || !listing) {
    return <div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>;
  }



  return (
    <div className="wrap">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Link href={`/city/${encodeURIComponent(city)}/${id}`} className="back-link">← View my public profile</Link>

      {isWelcome && !listing.is_active && (
        <div className="profile-card" style={{ background: '#F3EEDD', border: '1.5px dashed #C97F1E' }}>
          <h3>👋 Almost there!</h3>
          <p style={{ margin: 0 }}>
            Your listing is saved but not visible to customers yet. Complete a payment below to
            go live in {city}. Bookmark this page — it's where you'll always manage your listing.
          </p>
        </div>
      )}

      {justPaid && (
        <div className="profile-card" style={{ background: 'rgba(46,107,78,0.12)', border: '1.5px solid #2E6B4E' }}>
          <h3 style={{ color: '#2E6B4E' }}>✅ Payment successful — you're live!</h3>
          <p style={{ margin: 0 }}>
            Your listing is now visible to customers, active until{' '}
            <strong>{new Date(listing.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            Thank you for keeping Verilo running!
          </p>
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar">
          {listing.photo_url ? <img src={listing.photo_url} alt="" /> : initials(listing.name)}
        </div>
        <h2 className="profile-name">{listing.name}</h2>
        <div className="profile-service">{catLabel(listing.service)}</div>
        {listing.area && <p className="profile-meta">📍 {listing.area}</p>}
      </div>

      <div className="profile-card">
        <h3>Availability</h3>
        <p style={{ fontWeight: 700, color: listing.is_available === false ? '#C1442E' : '#2E6B4E', marginBottom: 4 }}>
          {listing.is_available === false ? '🔴 Marked as Not Available' : '🟢 Marked as Available'}
        </p>
        {listing.is_available === false && listing.unavailable_note && (
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>{listing.unavailable_note}</p>
        )}
        <button
          className="btn-primary"
          onClick={toggleAvailability}
          style={{ marginTop: 8, background: listing.is_available === false ? '#2E6B4E' : '#6B7280' }}
        >
          {listing.is_available === false ? 'Mark as Available' : 'Mark as Not Available'}
        </button>
      </div>

      <div className="profile-card">
        <h3>Enquiries {bookings.filter((b) => b.status === 'new').length > 0 && (
          <span style={{ background: 'var(--vermillion)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginLeft: 6 }}>
            {bookings.filter((b) => b.status === 'new').length} new
          </span>
        )}</h3>
        {bookings.length === 0 && <p style={{ color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>No enquiries yet.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="review-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <strong>{b.customer_name}</strong>
                {b.customer_phone && <span style={{ color: 'var(--muted)' }}> · {b.customer_phone}</span>}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, height: 'fit-content',
                color: b.status === 'new' ? 'var(--marigold-deep)' : b.status === 'accepted' ? '#2E6B4E' : b.status === 'rejected' ? 'var(--vermillion)' : 'var(--muted)',
                background: b.status === 'new' ? 'rgba(232,163,61,0.15)' : b.status === 'accepted' ? 'rgba(46,107,78,0.12)' : b.status === 'rejected' ? 'rgba(193,68,46,0.12)' : 'rgba(0,0,0,0.05)',
              }}>
                {b.status}
              </span>
            </div>
            {b.message && <p style={{ margin: '4px 0', fontSize: 13.5, fontStyle: 'italic' }}>"{b.message}"</p>}
            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 6px' }}>
              {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
            {b.status === 'new' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => respondToBooking(b.id, 'accepted')}
                  disabled={respondingId === b.id}
                  style={{ flex: 1, background: '#2E6B4E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => respondToBooking(b.id, 'rejected')}
                  disabled={respondingId === b.id}
                  style={{ flex: 1, background: 'var(--vermillion)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Decline
                </button>
              </div>
            )}
            {b.status === 'accepted' && (
              <button
                onClick={() => respondToBooking(b.id, 'completed')}
                disabled={respondingId === b.id}
                style={{ width: '100%', background: 'var(--paper-dim)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Mark Completed
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="profile-card">
        {!listing.is_active && (
          <div style={{ background: '#F3EEDD', border: '1.5px dashed #8A94A6', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
            <strong style={{ color: '#6B7280' }}>🔒 Your listing isn't visible to customers yet</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              Complete a payment below to publish it. This also applies if a past payment lapsed.
            </p>
          </div>
        )}
        <h3>{listing.is_active ? 'Renew your listing' : 'Activate your listing'}</h3>
        <p style={{ marginBottom: 10 }}>
          Choose a plan below — longer plans save you money and mean fewer things to remember.
        </p>
        <ul style={{ margin: '0 0 14px', paddingLeft: 18, fontSize: 13, color: '#6B7280' }}>
          <li>Stay visible to everyone searching in {city}</li>
          <li>Keep your rating & reviews public and growing</li>
          <li>Only ₹1/day — less than a cup of tea</li>
        </ul>

        <div style={{ display: 'grid', gap: 10 }}>
          {[1, 6, 12].map((m) => (
            <button
              key={m}
              className="btn-primary"
              onClick={() => handlePayNow(m)}
              disabled={payingNow}
              style={{
                marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: m === 12 ? '#C97F1E' : m === 6 ? '#C1442E' : '#6B7280', textAlign: 'left', padding: '12px 16px',
              }}
            >
              <span>
                <strong>{PLAN_LABELS[m].title}</strong> — {PLAN_LABELS[m].price}
                {PLAN_LABELS[m].note && (
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 500, opacity: 0.9 }}>{PLAN_LABELS[m].note}</span>
                )}
              </span>
              <span>{payingNow ? '...' : '→'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="profile-card" style={{ textAlign: 'center' }}>
        <Link
          href={`/city/${encodeURIComponent(city)}/${id}/edit`}
          style={{ color: '#C97F1E', fontWeight: 700, textDecoration: 'underline', fontSize: 14.5 }}
        >
          ✏️ Edit my listing details
        </Link>
      </div>

      <div className="profile-card" style={{ textAlign: 'center' }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: 'none', border: 'none', color: '#C1442E', fontSize: 13, textDecoration: 'underline', cursor: 'pointer',
          }}
        >
          {deleting ? 'Removing...' : 'Permanently delete my listing'}
        </button>
      </div>
    </div>
  );
}
