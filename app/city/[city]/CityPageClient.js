'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { CATEGORIES, catLabel, initials } from '../../../lib/categories';
import { CategoryIcon } from '../../../lib/categoryIcons';

export default function CityPageClient() {
  return (
    <Suspense fallback={<div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>}>
      <CityPageContent />
    </Suspense>
  );
}

function Stars({ value }) {
  const rounded = Math.round((value || 0) * 2) / 2;
  return (
    <span style={{ color: 'var(--marigold-deep)' }}>
      {'★'.repeat(Math.floor(rounded))}
      {rounded % 1 !== 0 ? '½' : ''}
      {'☆'.repeat(5 - Math.ceil(rounded))}
    </span>
  );
}

function CityPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const city = decodeURIComponent(params.city);
  const stateFromUrl = searchParams.get('state') || '';
  const [listings, setListings] = useState([]);
  const [cityState, setCityState] = useState(stateFromUrl);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Case-insensitive lookup so "Anuppur" and "anuppur" are treated as the same place.
      let query = supabase.from('cities').select('id, state').ilike('name', city);
      if (stateFromUrl) query = query.eq('state', stateFromUrl);
      let { data: cityRow } = await query.maybeSingle();

      if (!cityRow) {
        // create city on first visit, tagged with its state so it's properly grouped
        const { data: created } = await supabase
          .from('cities')
          .insert({ name: city, state: stateFromUrl || null })
          .select()
          .maybeSingle();
        cityRow = created;
      }
      if (!cityRow) { setLoading(false); return; }
      setCityState(cityRow.state || stateFromUrl);

      const { data: listingRows } = await supabase
        .from('listings')
        .select('*, ratings(stars)')
        .eq('city_id', cityRow.id)
        .eq('is_active', true);

      setListings(listingRows || []);
      setLoading(false);
    }
    load();
  }, [city, stateFromUrl]);


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
      list = list.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        (l.area || '').toLowerCase().includes(q) ||
        (l.pincode || '').includes(q.trim())
      );
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
        <p className="tagline">📍 Trusted people in {city}{cityState ? `, ${cityState}` : ''} — all in one place</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <Link href="/" className="back-link" style={{ margin: 0 }}>Switch area</Link>
          <span style={{ color: 'var(--line)' }}>·</span>
          <Link
            href={`/city/${encodeURIComponent(city)}/find${cityState ? '?state=' + encodeURIComponent(cityState) : ''}`}
            style={{
              fontSize: 12.5, fontWeight: 700, color: 'var(--marigold-deep)', background: 'rgba(232,163,61,0.14)',
              border: '1px solid rgba(232,163,61,0.35)', padding: '4px 12px', borderRadius: 999, textDecoration: 'none',
            }}
          >
            👤 I'm a Provider
          </Link>
        </div>
      </header>

      <div className="city-layout">
        <div className="city-main">
          <input className="search-bar" placeholder="Search by name, area, or pincode..." value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="cat-strip">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={'cat-chip' + (cat.key === activeTab ? ' active' : '')}
                onClick={() => setActiveTab(cat.key)}
              >
                <span className="cat-chip-icon"><CategoryIcon name={cat.key} width={22} height={22} /></span>
                <span className="cat-chip-label">{cat.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className={'tab' + (sortBy === 'rating' ? ' active' : '')} onClick={() => setSortBy('rating')}>Top rated</button>
            <button className={'tab' + (sortBy === 'new' ? ' active' : '')} onClick={() => setSortBy('new')}>Newest</button>
          </div>

          {loading && <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading...</p>}

          {!loading && filtered.length === 0 && (
            <div className="empty">
              <div className="empty-title">No listings yet</div>
              <div>Tap "+ Add Listing" below to add the first one</div>
            </div>
          )}

          <div className="listings-grid">
            {filtered.map((item) => (
        <Link key={item.id} className="card" href={`/city/${encodeURIComponent(city)}/${item.id}`}>
          <div className="card-top">
            <div className="card-left">
              <div style={{ position: 'relative', flex: '0 0 auto' }}>
                <div className="avatar">
                  {item.photo_url ? <img src={item.photo_url} alt="" /> : initials(item.name)}
                </div>
                <span style={{
                  position: 'absolute', bottom: -5, right: -5, width: 22, height: 22, borderRadius: 7,
                  background: 'var(--marigold)', color: '#2A1B05', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid var(--paper)',
                }}>
                  <CategoryIcon name={item.service} width={12} height={12} strokeWidth={2.2} />
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="card-service">{catLabel(item.service)}</div>
                <p className="card-name">
                  {item.name}
                  {item.verified && <span className="verified-badge">✓ Verified</span>}
                </p>
                {item.qualification && <p className="card-area">🏷️ {item.qualification}</p>}
                {item.area && <p className="card-area">📍 {item.area}{item.pincode ? ` - ${item.pincode}` : ''}</p>}
                {item.about && (
                  <p className="card-note" style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                    {item.about.length > 140 ? item.about.slice(0, 140) + '…' : item.about}
                  </p>
                )}
                <p className="card-rating">
                  {item.avgRating ? <><Stars value={item.avgRating} /> {item.avgRating.toFixed(1)} ({item.ratingCount})</> : 'No ratings yet'}
                  {' '}
                  <span style={{ color: item.is_available === false ? 'var(--vermillion)' : '#2E6B4E', fontWeight: 700 }}>
                    {item.is_available === false ? '· 🔴 Not available now' : '· 🟢 Available now'}
                  </span>
                </p>
                {item.is_available === false && item.unavailable_note && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{item.unavailable_note}</p>
                )}
              </div>
            </div>
            <a className="call-btn" href={`tel:${item.phone}`} onClick={(e) => e.stopPropagation()}>📞 Call</a>
          </div>
        </Link>
            ))}
          </div>
        </div>

        <div className="city-sidebar">
          <div style={{
            padding: '18px 16px', borderRadius: 14,
            background: 'rgba(232,163,61,0.10)', border: '1px solid rgba(232,163,61,0.3)', textAlign: 'center',
          }}>
            <p style={{ fontFamily: "'Rozha One', serif", fontSize: 16, color: 'var(--marigold-deep)', margin: '0 0 6px' }}>
              Are you a service provider?
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              Already have a listing on Verilo? Find it to check your status, pay, or edit your profile.
            </p>
            <Link
              href={`/city/${encodeURIComponent(city)}/find${cityState ? '?state=' + encodeURIComponent(cityState) : ''}`}
              style={{
                display: 'inline-block', background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)',
                padding: '9px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
              }}
            >
              Manage My Listing →
            </Link>
          </div>
        </div>
      </div>

      <Link href={`/city/${encodeURIComponent(city)}/add${cityState ? '?state=' + encodeURIComponent(cityState) : ''}`} className="fab">+ Add Listing</Link>
    </div>
  );
}
