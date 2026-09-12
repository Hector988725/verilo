'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { CATEGORIES, catLabel, catColor, initials } from '../../../lib/categories';
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

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
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
  const [showSortMenu, setShowSortMenu] = useState(false);
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

      // Explicit column list — never select('*') on a public page, since
      // that would also hand back manage_token (each listing's private key).
      const { data: listingRows } = await supabase
        .from('listings')
        .select('id, name, service, phone, area, pincode, qualification, about, photo_url, verified, is_available, unavailable_note, joined_at, ratings(stars)')
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

  const addHref = `/city/${encodeURIComponent(city)}/add${cityState ? '?state=' + encodeURIComponent(cityState) : ''}`;

  return (
    <div className="wrap">
      <header style={{ textAlign: 'left', marginBottom: 6 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Rozha One', serif", fontSize: 22, color: 'var(--marigold-deep)', flexShrink: 0, lineHeight: 1.3 }}>Verilo</span>
          <Link href="/" className="location-pill" style={{ flexShrink: 0 }}>📍 {city}{cityState ? `, ${cityState}` : ''}</Link>
        </div>
        <p className="greeting-eyebrow">{greetingWord()},</p>
        <p className="greeting-headline">Find trusted people near you</p>
        <Link href="/" className="back-link" style={{ margin: 0 }}>Switch area</Link>
      </header>

      <div style={{
        margin: '18px 0 22px', padding: '18px 16px', borderRadius: 16, textAlign: 'center',
        background: 'rgba(232,163,61,0.10)', border: '1px solid rgba(232,163,61,0.3)',
      }}>
        <p style={{ fontFamily: "'Rozha One', serif", fontSize: 16, color: 'var(--marigold-deep)', margin: '0 0 5px' }}>
          Are you a service provider?
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 12px' }}>
          List your business in {city} so customers here can find and call you directly.
        </p>
        <Link href={addHref} className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '10px 22px', textDecoration: 'none', margin: 0 }}>
          + Register as a Service Provider
        </Link>
        <p style={{ marginTop: 8 }}>
          <Link href="/provider/dashboard" style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline' }}>
            Already registered? Go to your dashboard →
          </Link>
        </p>
      </div>

      <div className="search-row" style={{ position: 'relative', marginBottom: 14 }}>
        <input className="search-bar" placeholder="Search by name, area, or pincode..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="filter-btn" onClick={() => setShowSortMenu((s) => !s)} aria-label="Sort options">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
        {showSortMenu && (
          <div style={{
            position: 'absolute', top: 52, right: 0, background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 12, boxShadow: 'var(--shadow)', padding: 6, zIndex: 10, minWidth: 150,
          }}>
            {[{ k: 'rating', l: '⭐ Top rated' }, { k: 'new', l: '🆕 Newest first' }].map((opt) => (
              <button
                key={opt.k}
                onClick={() => { setSortBy(opt.k); setShowSortMenu(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8,
                  border: 'none', background: sortBy === opt.k ? 'rgba(232,163,61,0.14)' : 'transparent',
                  color: sortBy === opt.k ? 'var(--marigold-deep)' : 'var(--ink)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="cat-strip">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={'cat-chip' + (cat.key === activeTab ? ' active' : '')}
            style={{ '--cat-color': catColor(cat.key) }}
            onClick={() => setActiveTab(cat.key)}
          >
            <span className="cat-chip-icon"><CategoryIcon name={cat.key} width={22} height={22} /></span>
            <span className="cat-chip-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-title">No listings yet</div>
          <div>Be the first service provider listed here</div>
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
                    background: catColor(item.service), color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: '2px solid var(--paper)',
                  }}>
                    <CategoryIcon name={item.service} width={12} height={12} strokeWidth={2.2} />
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="card-service" style={{ color: catColor(item.service), background: `color-mix(in srgb, ${catColor(item.service)} 15%, transparent)` }}>{catLabel(item.service)}</div>
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
  );
}
