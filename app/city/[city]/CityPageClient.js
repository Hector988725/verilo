'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { CATEGORIES, catLabel, catColor, catTagline, initials } from '../../../lib/categories';
import { CategoryIcon } from '../../../lib/categoryIcons';
import { shareApp } from '../../../lib/shareApp';
import { trackEvent } from '../../../lib/track';
import { useLanguage } from '../../../components/LanguageProvider';

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
    <span style={{ color: 'var(--star-gold)' }}>
      {'★'.repeat(Math.floor(rounded))}
      {rounded % 1 !== 0 ? '½' : ''}
      {'☆'.repeat(5 - Math.ceil(rounded))}
    </span>
  );
}

function greetingWord(t) {
  const h = new Date().getHours();
  if (h < 12) return t('good_morning');
  if (h < 17) return t('good_afternoon');
  return t('good_evening');
}

function productHits(shop, q) {
  if (!q) return [];
  return (shop.products || []).filter((p) =>
    `${p.n} ${p.c} ${p.b}`.toLowerCase().includes(q)
  );
}

function money(p) {
  return p == null ? '' : ` ₹${Number(p) % 1 === 0 ? Number(p) : Number(p).toFixed(2)}+`;
}

function ShopCard({ shop, q, t, lang }) {
  const hits = productHits(shop, q).slice(0, 3);
  const typeLabel = shop.business_type ? shop.business_type.charAt(0).toUpperCase() + shop.business_type.slice(1) : '';
  // Ek nazar me: dukaan kis cheez ki hai (top categories), kitni cheezein, kab khuli. Poora card dabane par seedha dukaan khulti hai.
  const sells = shop.categories.slice(0, 3).map((c) => c.name).join(' · ');
  const items = shop.product_count > 0 ? `${shop.product_count}${shop.product_count >= 40 ? '+' : ''} ${lang === 'hi' ? 'चीज़ें' : 'items'}` : '';
  return (
    <div className="listing-card shop-card">
      <div className="listing-photo">
        {shop.logo_url ? <img src={shop.logo_url} alt="" /> : <span className="listing-photo-fallback">{initials(shop.name)}</span>}
        <span className="listing-photo-tag" style={{ background: catColor('shops') }}>
          <CategoryIcon name="shops" width={10} height={10} />
        </span>
      </div>
      <div className="listing-body">
        <p className="listing-service" style={{ color: catColor('shops') }}>
          {t('shop_word')}{typeLabel ? ` · ${typeLabel}` : ''}
        </p>
        <a className="listing-name shop-link" href={shop.order_url} target="_blank" rel="noopener noreferrer">{shop.name}</a>
        {hits.length > 0 ? (
          <p className="shop-match">
            {hits.map((p, i) => <span key={i}>{i ? ' · ' : ''}{p.n}{money(p.p)}</span>)}
          </p>
        ) : sells ? (
          <p className="shop-sells">{sells}</p>
        ) : shop.tagline ? (
          <p className="shop-sells">{shop.tagline}</p>
        ) : null}
        <p className="listing-meta">{[items, shop.timings && `🕐 ${shop.timings}`].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="shop-actions">
        <span className="listing-call-btn shop-order-btn">🛒 {t('order_online')} →</span>
        {shop.maps_url && (
          <a className="listing-call-btn shop-maps-btn" href={shop.maps_url} target="_blank" rel="noopener noreferrer" aria-label="Directions">📍</a>
        )}
      </div>
    </div>
  );
}

function CityPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const city = decodeURIComponent(params.city);
  const stateFromUrl = searchParams.get('state') || '';
  const [listings, setListings] = useState([]);
  const [shops, setShops] = useState([]);
  const [cityState, setCityState] = useState(stateFromUrl);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
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
        // city pehli baar khulne par server banata hai (browser seedha cities mein insert nahi karta)
        try {
          const res = await fetch('/api/city/ensure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: city, state: stateFromUrl || null }),
          });
          if (res.ok) cityRow = await res.json();
        } catch (e) {}
      }
      if (!cityRow) { setLoading(false); return; }
      setCityState(cityRow.state || stateFromUrl);

      // Explicit column list — never select('*') on a public page, since
      // that would also hand back manage_token (each listing's private key).
      const { data: listingRows } = await supabase
        .from('listings')
        .select('id, name, service, phone, area, pincode, qualification, about, photo_url, verified, phone_verified, is_available, unavailable_note, joined_at, ratings(stars)')
        .eq('city_id', cityRow.id)
        .eq('is_active', true);

      setListings(listingRows || []);
      setLoading(false);

      // Dukaan Order System ki opt-in shops (alag fetch: fail ho to baaki page par asar nahi)
      try {
        const sp = new URLSearchParams({ city });
        const st = cityRow.state || stateFromUrl;
        if (st) sp.set('state', st);
        const res = await fetch('/api/shops?' + sp.toString());
        if (res.ok) {
          const j = await res.json();
          setShops(Array.isArray(j.shops) ? j.shops : []);
        }
      } catch (e) {}
    }
    load();
  }, [city, stateFromUrl]);


  const withRating = listings.map((l) => {
    const stars = (l.ratings || []).map((r) => r.stars);
    const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : null;
    return { ...l, avgRating: avg, ratingCount: stars.length };
  });

  // Town/area ki list listings ke "Area / Locality" se apne aap banti hai (koi fixed list nahi, poore desh me chalega).
  // Spelling/capital ka fark ek hi maana jaata hai; sabse zyada likha gaya roop dikhta hai.
  const areaOptions = useMemo(() => {
    const m = new Map();
    for (const l of listings) {
      const raw = String(l.area || '').trim().replace(/\s+/g, ' ');
      if (raw.length < 2) continue;
      const key = raw.toLowerCase();
      const e = m.get(key) || { key, count: 0, forms: new Map() };
      e.count += 1;
      e.forms.set(raw, (e.forms.get(raw) || 0) + 1);
      m.set(key, e);
    }
    return [...m.values()]
      .map((e) => ({ key: e.key, count: e.count, label: [...e.forms.entries()].sort((a, b) => b[1] - a[1])[0][0] }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [listings]);
  const areaKey = areaOptions.some((o) => o.key === areaFilter) ? areaFilter : '';

  const filtered = useMemo(() => {
    let list = withRating;
    if (areaKey) list = list.filter((l) => String(l.area || '').toLowerCase().includes(areaKey));
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
  }, [withRating, activeTab, search, sortBy, areaKey]);

  // Dukaan shops: search me naam, address, pincode, shop type AUR unke products (naam/category/brand) match hote hain.
  const q = search.trim().toLowerCase();
  const shopMatches = (shop) => {
    const text = [shop.name, shop.tagline, shop.address, shop.business_type, shop.pincode, shop.city]
      .filter(Boolean).join(' ').toLowerCase();
    return text.includes(q) || shop.pincode.includes(q) || productHits(shop, q).length > 0;
  };
  const visibleShops = useMemo(() => {
    if (activeTab !== 'all' && activeTab !== 'shops') return [];
    let list = shops;
    if (areaKey) list = list.filter((s) => String(s.address || '').toLowerCase().includes(areaKey));
    if (q) list = list.filter(shopMatches);
    // search me jin shops me product mila wo upar
    if (q) list = [...list].sort((a, b) => productHits(b, q).length - productHits(a, q).length);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, activeTab, q, areaKey]);

  // "All" me providers aur shops mix: har 3 providers ke baad 1 shop (search me matching shops sabse upar)
  const mixed = useMemo(() => {
    if (activeTab === 'shops') return visibleShops.map((s) => ({ kind: 'shop', s }));
    const ps = filtered.map((l) => ({ kind: 'provider', l }));
    const ss = visibleShops.map((s) => ({ kind: 'shop', s }));
    if (!ss.length) return ps;
    if (q) {
      const hit = ss.filter((x) => productHits(x.s, q).length > 0);
      const rest = ss.filter((x) => productHits(x.s, q).length === 0);
      return [...hit, ...ps, ...rest];
    }
    const out = [];
    let si = 0;
    ps.forEach((p, i) => {
      out.push(p);
      if ((i + 1) % 3 === 0 && si < ss.length) out.push(ss[si++]);
    });
    while (si < ss.length) out.push(ss[si++]);
    return out;
  }, [filtered, visibleShops, activeTab, q]);

  const addHref = `/city/${encodeURIComponent(city)}/add${cityState ? '?state=' + encodeURIComponent(cityState) : ''}`;

  const providerCard = (item) => (
    <Link key={item.id} className="listing-card" href={`/city/${encodeURIComponent(city)}/${item.id}`}>
      <div className="listing-photo">
        {item.photo_url ? <img src={item.photo_url} alt="" /> : <span className="listing-photo-fallback">{initials(item.name)}</span>}
        <span className="listing-photo-tag" style={{ background: catColor(item.service) }}>
          <CategoryIcon name={item.service} width={10} height={10} />
        </span>
        {(item.verified || item.phone_verified) && <span className="listing-photo-verified">✓</span>}
      </div>
      <div className="listing-body">
        <p className="listing-service" style={{ color: catColor(item.service) }}>{catLabel(item.service)}</p>
        <p className="listing-name">{item.name}</p>
        <p className="listing-rating">
          {item.avgRating ? <><Stars value={item.avgRating} /> {item.avgRating.toFixed(1)} ({item.ratingCount})</> : t('no_ratings_yet')}
        </p>
        {item.area && <p className="listing-meta">📍 {item.area}{item.pincode ? ` - ${item.pincode}` : ''}</p>}
        <p className="listing-avail">
          <span style={{ color: item.is_available === false ? 'var(--vermillion)' : '#1F6F52' }}>
            {item.is_available === false ? t('not_available') : t('available_now')}
          </span>
        </p>
      </div>
      <a className="listing-call-btn" href={`tel:${item.phone}`} onClick={(e) => { e.stopPropagation(); trackEvent(item.id, 'call'); }}>📞 {t('call')}</a>
    </Link>
  );

  return (
    <div className="wrap">
      <header style={{ textAlign: 'left', marginBottom: 6 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
          <a onClick={(e) => { e.preventDefault(); router.replace('/'); }} href="/" style={{ fontFamily: "'Rozha One', serif", fontSize: 22, color: 'var(--navy)', flexShrink: 0, lineHeight: 1.3, textDecoration: 'none', cursor: 'pointer' }}>Verilo</a>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <a onClick={(e) => { e.preventDefault(); router.replace('/'); }} href="/" className="location-pill">📍 {city}{cityState ? `, ${cityState}` : ''}</a>
            <div style={{ display: 'flex', border: '1.5px solid var(--line-strong)', borderRadius: 999, overflow: 'hidden' }}>
              <button onClick={() => setLang('en')} style={{ padding: '4px 9px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: lang === 'en' ? 'var(--navy)' : 'transparent', color: lang === 'en' ? '#fff' : 'var(--muted)' }}>EN</button>
              <button onClick={() => setLang('hi')} style={{ padding: '4px 9px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: lang === 'hi' ? 'var(--navy)' : 'transparent', color: lang === 'hi' ? '#fff' : 'var(--muted)' }}>हिं</button>
            </div>
          </div>
        </div>
        <p className="greeting-eyebrow">{greetingWord(t)},</p>
        <p className="greeting-headline">{t('find_trusted_people')}</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <a onClick={(e) => { e.preventDefault(); router.replace('/'); }} href="/" className="back-link" style={{ margin: 0 }}>{t('switch_area')}</a>
          <span style={{ color: 'var(--line)' }}>·</span>
          <span onClick={shareApp} className="back-link" style={{ margin: 0, cursor: 'pointer' }}>{t('share_verilo')}</span>
        </div>
      </header>

      <div style={{
        margin: '14px 0 18px', padding: '10px 14px', borderRadius: 12,
        background: 'rgba(232,163,61,0.10)', border: '1px solid rgba(232,163,61,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <p style={{ fontSize: 12.5, color: 'var(--marigold-deep)', fontWeight: 700, margin: 0, flex: '1 1 160px' }}>
          {t('are_you_provider')}
        </p>
        <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
          <Link
            href={addHref}
            className="btn-primary"
            style={{
              display: 'inline-block', width: 'auto', padding: '7px 14px', textDecoration: 'none', margin: 0,
              background: 'var(--navy)', boxShadow: '0 6px 14px rgba(22,35,46,0.28)', fontSize: 12.5, borderRadius: 8,
            }}
          >
            {t('register')}
          </Link>
          <Link
            href="/provider/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
              color: 'var(--marigold-deep)', border: '1px solid rgba(232,163,61,0.5)', borderRadius: 8, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            My Dashboard
          </Link>
        </div>
      </div>

      <div className="search-row" style={{ position: 'relative', marginBottom: 14 }}>
        <input className="search-bar" placeholder={t('search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
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

      {areaOptions.length >= 2 && (
        <div style={{ marginBottom: 12 }}>
          <select
            value={areaKey}
            onChange={(e) => setAreaFilter(e.target.value)}
            aria-label={lang === 'hi' ? 'इलाका चुनें' : 'Choose area / town'}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--line-strong)', background: 'var(--paper)', color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}
          >
            <option value="">{lang === 'hi' ? '📍 सभी इलाके / कस्बे' : '📍 All areas / towns'}</option>
            {areaOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label} ({o.count})</option>
            ))}
          </select>
        </div>
      )}

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
        {shops.length > 0 && (
          <button
            className={'cat-chip' + (activeTab === 'shops' ? ' active' : '')}
            style={{ '--cat-color': catColor('shops') }}
            onClick={() => setActiveTab('shops')}
          >
            <span className="cat-chip-icon"><CategoryIcon name="shops" width={22} height={22} /></span>
            <span className="cat-chip-label">{t('shops_label')}</span>
          </button>
        )}
      </div>

      {activeTab !== 'all' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '18px 18px', borderRadius: 16,
          marginBottom: 18, background: `color-mix(in srgb, ${catColor(activeTab)} 14%, white)`,
          border: `1px solid color-mix(in srgb, ${catColor(activeTab)} 30%, transparent)`,
        }}>
          <span style={{
            width: 52, height: 52, borderRadius: 14, flex: '0 0 auto', background: catColor(activeTab),
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 18px color-mix(in srgb, ${catColor(activeTab)} 40%, transparent)`,
          }}>
            <CategoryIcon name={activeTab} width={26} height={26} />
          </span>
          <div>
            <p style={{ margin: 0, fontFamily: "'Rozha One', serif", fontSize: 17, color: catColor(activeTab) }}>
              {activeTab === 'shops' ? t('shops_near_you') : `${catLabel(activeTab)} near you`}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>{activeTab === 'shops' ? t('shops_tagline') : catTagline(activeTab)}</p>
          </div>
        </div>
      )}

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading...</p>}

      {!loading && mixed.length === 0 && (
        <div className="empty">
          <div className="empty-title">No listings yet</div>
          <div>Be the first service provider listed here</div>
        </div>
      )}

      <div className="listings-grid-v2">
        {mixed.map((m) => m.kind === 'shop' ? (
          <ShopCard key={'shop-' + m.s.store_id} shop={m.s} q={q} t={t} lang={lang} />
        ) : providerCard(m.l))}
      </div>
    </div>
  );
}
