'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';
import { supabase } from '../../../lib/supabaseClient';
import { saveMyToken, getAllMyListings } from '../../../lib/ownership';
import { catLabel, initials } from '../../../lib/categories';

export default function ProviderDashboard() {
  const { user, loading, signOut } = useAuth();
  const [listings, setListings] = useState(null); // null = loading
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!user) { setListings(null); return; }
    refresh();
  }, [user]);

  async function refresh() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) return;

    // First, silently link any listing this browser already has a private
    // link for (from before this provider had an account) to their account.
    setLinking(true);
    const localMap = getAllMyListings();
    await Promise.all(
      Object.entries(localMap).map(([listing_id, token]) =>
        fetch('/api/provider/claim-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ listing_id, token }),
        }).catch(() => {})
      )
    );
    setLinking(false);

    const res = await fetch('/api/provider/my-listings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result = await res.json();
    const rows = result.listings || [];
    // Cache each token locally so the existing (unchanged) /manage page —
    // which checks localStorage — works right away, even on a brand-new device.
    rows.forEach((l) => { if (l.manage_token) saveMyToken(l.id, l.manage_token); });
    setListings(rows);
  }

  if (loading) return <div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>;

  if (!user) {
    return (
      <div className="city-screen">
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Please sign in to view your dashboard</p>
        <Link href="/provider/login?next=/provider/dashboard" className="btn-primary" style={{ maxWidth: 280, textAlign: 'center', textDecoration: 'none', display: 'block', marginTop: 18 }}>
          Sign In / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Rozha One', serif", fontSize: 22, color: 'var(--marigold-deep)' }}>Verilo</span>
          <button onClick={signOut} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, color: 'var(--muted)', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
        <p className="greeting-headline" style={{ marginTop: 10 }}>Your Listings</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -10 }}>{user.email}</p>
      </header>

      {(listings === null || linking) && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading your listings...</p>}

      {listings !== null && !linking && listings.length === 0 && (
        <div className="empty">
          <div className="empty-title">No listings yet</div>
          <div>List your business so customers in your area can find you</div>
        </div>
      )}

      {listings !== null && !linking && listings.map((l) => (
        <div key={l.id} className="card" style={{ cursor: 'default' }}>
          <div className="card-top">
            <div className="card-left">
              <div className="avatar">{initials(l.name)}</div>
              <div>
                <div className="card-service">{catLabel(l.service)}</div>
                <p className="card-name">{l.name}</p>
                <p className="card-area">📍 {l.cities?.name}{l.cities?.state ? `, ${l.cities.state}` : ''}</p>
                <p style={{ fontSize: 12.5, fontWeight: 700, marginTop: 4, color: l.is_active ? '#2E6B4E' : 'var(--vermillion)' }}>
                  {l.is_active ? '🟢 Active — visible to customers' : '🔴 Inactive — payment needed'}
                </p>
              </div>
            </div>
          </div>
          <Link
            href={`/city/${encodeURIComponent(l.cities?.name || '')}/${l.id}/manage`}
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 12 }}
          >
            {l.is_active ? 'Manage / Renew' : 'Manage / Pay Now'}
          </Link>
        </div>
      ))}

      <Link href="/" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: 'var(--ink)', boxShadow: 'none', marginTop: 8 }}>
        + List a New Service
      </Link>
    </div>
  );
}
