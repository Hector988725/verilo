'use client';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '../../../../../lib/supabaseClient';
import { catLabel, initials, isInTrial, daysLeft } from '../../../../../lib/categories';

export default function ManageListingPage() {
  return (
    <Suspense fallback={<div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>}>
      <ManageContent />
    </Suspense>
  );
}

function ManageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  const city = decodeURIComponent(params.city);
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [payingNow, setPayingNow] = useState(false);
  const [pausing, setPausing] = useState(false);

  useEffect(() => {
    try {
      const mine = JSON.parse(localStorage.getItem('verilo_my_listings') || '[]');
      setAllowed(mine.includes(id));
    } catch (e) { setAllowed(false); }
    load();
  }, [id]);

  async function load() {
    const { data } = await supabase.from('listings').select('*').eq('id', id).single();
    setListing(data);
  }

  async function togglePause() {
    setPausing(true);
    await supabase.from('listings').update({ is_active: !listing.is_active }).eq('id', id);
    setPausing(false);
    load();
  }

  async function toggleAvailability() {
    const goingAvailable = listing.is_available === false;
    let note = null;
    if (!goingAvailable) {
      note = prompt('Optional: when will you be available again? (e.g. "Back on Monday", "Available after 5 PM")') || null;
    }
    await supabase.from('listings').update({
      is_available: goingAvailable,
      unavailable_note: goingAvailable ? null : note,
    }).eq('id', id);
    load();
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

  if (allowed === false) {
    return (
      <div className="wrap">
        <header><div className="pin"></div><h1>Verilo</h1></header>
        <div className="empty">
          <div className="empty-title">Not verified</div>
          <div>
            This management page can only be opened from the device that added the listing,
            or after verifying with your phone number.{' '}
            <Link href={`/city/${encodeURIComponent(city)}/find`} style={{ color: '#E8A33D' }}>
              Verify with your phone number →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (allowed === null || !listing) {
    return <div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>;
  }

  const trial = isInTrial(listing);

  return (
    <div className="wrap">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Link href={`/city/${encodeURIComponent(city)}/${id}`} className="back-link">← View my public profile</Link>

      {isWelcome && (
        <div className="profile-card" style={{ background: '#F3EEDD', border: '1.5px dashed #C97F1E' }}>
          <h3>🎉 Your listing is live!</h3>
          <p style={{ margin: 0 }}>
            Bookmark this page — this is where you manage your listing, pay your monthly fee,
            and update your details.
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
        {!listing.is_active && (
          <div style={{ background: '#F3EEDD', border: '1.5px dashed #8A94A6', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
            <strong style={{ color: '#6B7280' }}>⏸️ Your listing is paused</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              It's hidden from search results. Unpause anytime to make it visible again.
            </p>
          </div>
        )}
        <h3>{trial ? `Free trial — ${daysLeft(listing)} days left` : 'Monthly fee due'}</h3>
        <p style={{ marginBottom: 12 }}>
          {trial
            ? 'Your listing is free until the trial ends. Pay anytime to lock in your spot after that.'
            : 'Your free trial has ended. Pay ₹30 to keep this listing active for another month.'}
        </p>
        <button className="btn-primary" onClick={handlePayNow} disabled={payingNow} style={{ marginTop: 0 }}>
          {payingNow ? 'Opening payment...' : 'Pay ₹30 for this month'}
        </button>
        <button
          className="btn-primary"
          onClick={togglePause}
          disabled={pausing}
          style={{ marginTop: 10, background: listing.is_active ? '#6B7280' : '#2E6B4E' }}
        >
          {pausing ? 'Updating...' : listing.is_active ? '⏸️ Pause my listing' : '▶️ Unpause my listing'}
        </button>
      </div>

      <div className="profile-card" style={{ textAlign: 'center' }}>
        <Link
          href={`/city/${encodeURIComponent(city)}/${id}/edit`}
          style={{ color: '#C97F1E', fontWeight: 700, textDecoration: 'underline', fontSize: 14.5 }}
        >
          ✏️ Edit my listing details
        </Link>
      </div>
    </div>
  );
}
