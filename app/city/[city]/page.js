'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { CATEGORIES, catLabel, initials } from '../../../lib/categories';

export default function CityPage() {
  const params = useParams();
  const city = decodeURIComponent(params.city);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: cityRow } = await supabase.from('cities').select('id').eq('name', city).maybeSingle();
      if (!cityRow) {
        // create city on first visit
        await supabase.from('cities').insert({ name: city });
      }
      const { data: cityRow2 } = await supabase.from('cities').select('id').eq('name', city).maybeSingle();
      if (!cityRow2) { setLoading(false); return; }

      const { data: listingRows } = await supabase
        .from('listings')
        .select('*, ratings(stars)')
        .eq('city_id', cityRow2.id)
        .eq('is_active', true);

      setListings(listingRows || []);
      setLoading(false);
    }
    load();
  }, [city]);

  const withRating = listings.map((l) => {
    const stars = (l.ratings || []).map((r) => r.stars);
    const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : null;
    return { ...l, avgRating: avg, ratingCount: stars.length };
  });

  const filtered = useMemo(() => {
    let list = withRating;
    if (activeTab !== 'all') list = list.filter((l) => l.service === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || (l.area || '').toLowerCase().includes(q));
    }
    if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else {
      list = [...list].sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at));
    }
    return list;
  }, [withRating, activeTab, search, sortBy]);

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">📍 Trusted people in {city} — all in one place</p>
        <Link href="/" className="back-link">Switch area</Link>
      </header>

      <input className="search-bar" placeholder="Search by name or area..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="tabs">
        {CATEGORIES.map((cat) => (
          <button key={cat.key} className={'tab' + (cat.key === activeTab ? ' active' : '')} onClick={() => setActiveTab(cat.key)}>
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={'tab' + (sortBy === 'rating' ? ' active' : '')} onClick={() => setSortBy('rating')}>Top rated</button>
        <button className={'tab' + (sortBy === 'new' ? ' active' : '')} onClick={() => setSortBy('new')}>Newest</button>
      </div>

      {loading && <p style={{ color: '#8A94A6', textAlign: 'center' }}>Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-title">No listings yet</div>
          <div>Tap "+ Add Listing" below to add the first one</div>
        </div>
      )}

      {filtered.map((item) => (
        <Link key={item.id} className="card" href={`/city/${encodeURIComponent(city)}/${item.id}`}>
          <div className="card-top">
            <div className="card-left">
              <div className="avatar">
                {item.photo_url ? <img src={item.photo_url} alt="" /> : initials(item.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="card-service">{catLabel(item.service)}</div>
                <p className="card-name">
                  {item.name}
                  {item.verified && <span className="verified-badge">✓ Verified</span>}
                </p>
                {item.qualification && <p className="card-area">🏷️ {item.qualification}</p>}
                {item.area && <p className="card-area">📍 {item.area}</p>}
                {item.about && (
                  <p className="card-note" style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                    {item.about.length > 140 ? item.about.slice(0, 140) + '…' : item.about}
                  </p>
                )}
                <p className="card-rating">
                  {item.avgRating ? `★ ${item.avgRating.toFixed(1)} (${item.ratingCount})` : 'No ratings yet'}
                  {' '}
                  <span style={{ color: item.is_available === false ? '#C1442E' : '#2E6B4E', fontWeight: 700 }}>
                    {item.is_available === false ? '· 🔴 Not available now' : '· 🟢 Available now'}
                  </span>
                </p>
                {item.is_available === false && item.unavailable_note && (
                  <p style={{ fontSize: 12, color: '#8A94A6', margin: '2px 0 0' }}>{item.unavailable_note}</p>
                )}
              </div>
            </div>
            <a className="call-btn" href={`tel:${item.phone}`} onClick={(e) => e.stopPropagation()}>📞 Call</a>
          </div>
        </Link>
      ))}

      <Link href={`/city/${encodeURIComponent(city)}/add`} className="fab">+ Add Listing</Link>

      <div style={{
        marginTop: 40, padding: '18px 16px', borderRadius: 14,
        background: 'rgba(232,163,61,0.08)', border: '1px solid rgba(232,163,61,0.25)', textAlign: 'center',
      }}>
        <p style={{ fontFamily: "'Rozha One', serif", fontSize: 16, color: '#E8A33D', margin: '0 0 6px' }}>
          Are you a service provider?
        </p>
        <p style={{ fontSize: 13, color: '#8A94A6', margin: '0 0 12px' }}>
          Already have a listing on Verilo? Find it to check your status, pay, or edit your profile.
        </p>
        <Link
          href={`/city/${encodeURIComponent(city)}/find`}
          style={{
            display: 'inline-block', background: '#232F3E', color: '#FFFDF6', border: '1px solid rgba(255,255,255,0.15)',
            padding: '9px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
          }}
        >
          Manage My Listing →
        </Link>
      </div>
    </div>
  );
}
