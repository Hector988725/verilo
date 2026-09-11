'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import { catLabel, initials } from '../../lib/categories';

export default function SavedPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) { setFetching(false); return; }
    async function load() {
      const { data } = await supabase
        .from('saved_listings')
        .select('id, listing:listings(id, name, service, area, pincode, photo_url, city_id, cities(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setItems(data || []);
      setFetching(false);
    }
    load();
  }, [user]);

  async function unsave(savedId) {
    await supabase.from('saved_listings').delete().eq('id', savedId);
    setItems((prev) => prev.filter((i) => i.id !== savedId));
  }

  if (loading || fetching) return <div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>;

  if (!user) {
    return (
      <div className="city-screen">
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Sign in to see your saved listings</p>
        <Link href="/profile" className="btn-primary" style={{ maxWidth: 260, textAlign: 'center', textDecoration: 'none', display: 'block', marginTop: 18 }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">❤️ Your Saved Listings</p>
      </header>

      {items.length === 0 && (
        <div className="empty">
          <div className="empty-title">Nothing saved yet</div>
          <div>Tap the ❤️ on any listing to save it here for later</div>
        </div>
      )}

      <div className="listings-grid">
        {items.map(({ id, listing }) => listing && (
          <Link key={id} className="card" href={`/city/${encodeURIComponent(listing.cities?.name || '')}/${listing.id}`}>
            <div className="card-top">
              <div className="card-left">
                <div className="avatar">
                  {listing.photo_url ? <img src={listing.photo_url} alt="" /> : initials(listing.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="card-service">{catLabel(listing.service)}</div>
                  <p className="card-name">{listing.name}</p>
                  {listing.area && <p className="card-area">📍 {listing.area}{listing.pincode ? ` - ${listing.pincode}` : ''}</p>}
                </div>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); unsave(id); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--vermillion)' }}
                aria-label="Remove from saved"
              >
                ✕
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
