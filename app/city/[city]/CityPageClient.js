'use client';
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { CATEGORIES, catLabel, catColor, catTagline, initials } from '../../../lib/categories';
import { CategoryIcon } from '../../../lib/categoryIcons';
import { shareApp } from '../../../lib/shareApp';
import { MIN_RATINGS_FOR_AVG, ratingLabel } from '../../../lib/ratings';
import { trackEvent } from '../../../lib/track';
import { useLanguage } from '../../../components/LanguageProvider';
import { ShopCard, productHits } from '../../../components/ShopCard';

// City Shops view shows shops 20 at a time ("Show more" adds the next 20).
const SHOPS_PAGE_SIZE = 20;
const SHOP_PREVIEW = 4; // All tab: how many shop tiles show before "See all shops"

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
  const [reviewFor, setReviewFor] = useState(null);
  const [shopsShown, setShopsShown] = useState(SHOPS_PAGE_SIZE); // City Shops page: 20 at a time
  const [reviewRows, setReviewRows] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  // "Switch area" / location pill: district list of the same state, opens on this page
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [districtList, setDistrictList] = useState(null);
  const [districtLoading, setDistrictLoading] = useState(false);

  // Category strip: arrow buttons for mouse users (phones just swipe). Arrows show only while there is more to scroll.
  const stripRef = useRef(null);
  const [stripEnds, setStripEnds] = useState({ left: false, right: false });
  function updateStripEnds() {
    const el = stripRef.current;
    if (!el) return;
    setStripEnds({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }
  function scrollStrip(dir) {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: 'smooth' });
  }
  useEffect(() => {
    updateStripEnds();
    window.addEventListener('resize', updateStripEnds);
    return () => window.removeEventListener('resize', updateStripEnds);
  }, [shops.length, loading]);

  function openSwitcher() {
    setSwitcherOpen(true);
    if (districtList !== null || !cityState) return;
    setDistrictLoading(true);
    supabase.from('cities').select('name').eq('state', cityState).order('name').then(({ data }) => {
      setDistrictList((data || []).map((c) => c.name));
      setDistrictLoading(false);
    }, () => setDistrictLoading(false));
  }

  const actionPill = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999,
    border: '1.5px solid var(--line-strong)', background: 'var(--paper, #fff)', color: 'var(--ink)',
    fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit', margin: 0,
  };

  function openReviews(item) {
    setReviewFor(item);
    setReviewRows([]);
    setReviewLoading(true);
    supabase
      .from('ratings')
      .select('id, stars, review_text, reviewer_name, created_at')
      .eq('listing_id', item.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setReviewRows(data || []); setReviewLoading(false); }, () => setReviewLoading(false));
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setShops([]);
      setActiveTab('all');
      setSearch('');
      setAreaFilter('');
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
    // 3 se kam reviews par average/star nahi dikhate (aur ranking me bhi nahi gintey)
    return { ...l, avgRating: stars.length >= MIN_RATINGS_FOR_AVG ? avg : null, ratingCount: stars.length };
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

  // Shops ab chhote tiles me alag block (ek line me kai), providers apne card grid me.
  // All tab me shuru ke SHOP_PREVIEW shops, baaki "See all shops" se; search me sab matching shops.
  const providerItems = activeTab === 'shops' ? [] : filtered;
  const shopItems = visibleShops;

  // Back to the first 20 whenever the view, search or area changes.
  useEffect(() => { setShopsShown(SHOPS_PAGE_SIZE); }, [activeTab, q, areaKey]);

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
        <p
          className="listing-rating"
          style={item.ratingCount > 0 ? { cursor: 'pointer', textDecoration: 'underline' } : undefined}
          onClick={item.ratingCount > 0 ? (e) => { e.preventDefault(); e.stopPropagation(); openReviews(item); } : undefined}
        >
          {item.avgRating ? <><Stars value={item.avgRating} /> {item.avgRating.toFixed(1)} ({item.ratingCount})</> : item.ratingCount > 0 ? ratingLabel(item.ratingCount) : t('no_ratings_yet')}
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
            <button type="button" onClick={openSwitcher} className="location-pill" style={{ cursor: 'pointer', fontFamily: 'inherit' }} aria-haspopup="dialog">
              📍 {city}{cityState ? `, ${cityState}` : ''} <span style={{ fontSize: 10 }}>▾</span>
            </button>
            <div style={{ display: 'flex', border: '1.5px solid var(--line-strong)', borderRadius: 999, overflow: 'hidden' }}>
              <button onClick={() => setLang('en')} style={{ padding: '4px 9px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: lang === 'en' ? 'var(--navy)' : 'transparent', color: lang === 'en' ? '#fff' : 'var(--muted)' }}>EN</button>
              <button onClick={() => setLang('hi')} style={{ padding: '4px 9px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: lang === 'hi' ? 'var(--navy)' : 'transparent', color: lang === 'hi' ? '#fff' : 'var(--muted)' }}>हिं</button>
            </div>
          </div>
        </div>
        <p className="greeting-eyebrow">{greetingWord(t)},</p>
        <p className="greeting-headline">{t('find_trusted_people')}</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={openSwitcher} style={actionPill}>🔄 {t('switch_area')}</button>
          <button type="button" onClick={shareApp} style={actionPill}>↗ {t('share_verilo')}</button>
          {shops.length > 0 && (
            <Link
              href={`/city/${encodeURIComponent(city)}/shops${cityState ? '?state=' + encodeURIComponent(cityState) : ''}`}
              style={{ ...actionPill, color: catColor('shops'), borderColor: catColor('shops') }}
            >
              <CategoryIcon name="shops" width={14} height={14} />
              {t('all_shops_in').replace('{city}', city)}
            </Link>
          )}
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
          {/* Plain link on purpose: the provider area is its own installable app, so it must load with its own manifest. */}
          <a
            href="/provider/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
              color: 'var(--marigold-deep)', border: '1px solid rgba(232,163,61,0.5)', borderRadius: 8, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            My Dashboard
          </a>
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

      <div className="cat-strip-wrap">
        {stripEnds.left && (
          <button type="button" className="cat-arrow cat-arrow-left" onClick={() => scrollStrip(-1)} aria-label="Scroll categories left">‹</button>
        )}
        {stripEnds.right && (
          <button type="button" className="cat-arrow cat-arrow-right" onClick={() => scrollStrip(1)} aria-label="Scroll categories right">›</button>
        )}
      <div className="cat-strip" ref={stripRef} onScroll={updateStripEnds}>
        {CATEGORIES.map((cat, i) => {
          const prev = CATEGORIES[i - 1];
          const startsEvents = cat.group === 'events' && prev?.group !== 'events';
          const endsEvents = cat.group !== 'events' && prev?.group === 'events';
          return (
            <Fragment key={cat.key}>
              {startsEvents && <span className="cat-group-tag">Events</span>}
              {endsEvents && <span className="cat-divider" />}
              <button
                className={'cat-chip' + (cat.key === activeTab ? ' active' : '')}
                style={{ '--cat-color': catColor(cat.key) }}
                onClick={() => setActiveTab(cat.key)}
              >
                <span className="cat-chip-icon"><CategoryIcon name={cat.key} width={22} height={22} /></span>
                <span className="cat-chip-label">{cat.label}</span>
              </button>
            </Fragment>
          );
        })}
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

      {!loading && providerItems.length + shopItems.length === 0 && (
        <div className="empty">
          <div className="empty-title">No listings yet</div>
          <div>Be the first service provider listed here</div>
        </div>
      )}

      {activeTab === 'shops' && shopItems.length > 0 && (
        <div className="shops-grid">
          {shopItems.slice(0, shopsShown).map((s) => (
            <ShopCard key={'shop-' + s.store_id} shop={s} q={q} t={t} lang={lang} compact />
          ))}
        </div>
      )}

      {activeTab !== 'shops' && shopItems.length > 0 && (
        <section style={{ margin: '0 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 2px 8px' }}>
            <strong style={{ fontSize: 14, color: catColor('shops') }}>{t('shops_label')} · {shopItems.length}</strong>
            {!q && shopItems.length > SHOP_PREVIEW && (
              <Link
                href={`/city/${encodeURIComponent(city)}/shops${cityState ? '?state=' + encodeURIComponent(cityState) : ''}`}
                style={{ fontSize: 12.5, fontWeight: 700, color: catColor('shops'), textDecoration: 'none' }}
              >
                {t('see_all_shops')}
              </Link>
            )}
          </div>
          <div className="shops-grid">
            {(q ? shopItems : shopItems.slice(0, SHOP_PREVIEW)).map((s) => (
              <ShopCard key={'shop-' + s.store_id} shop={s} q={q} t={t} lang={lang} compact />
            ))}
          </div>
        </section>
      )}

      {providerItems.length > 0 && (
        <div className="listings-grid-v2">
          {providerItems.map((l) => providerCard(l))}
        </div>
      )}

      {activeTab === 'shops' && shopItems.length > shopsShown && (
        <button
          onClick={() => setShopsShown((n) => n + SHOPS_PAGE_SIZE)}
          style={{ display: 'block', margin: '16px auto 0', padding: '10px 22px', borderRadius: 999, border: `1.5px solid ${catColor('shops')}`, background: '#fff', color: catColor('shops'), fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {t('show_more_shops')} ({shopItems.length - shopsShown})
        </button>
      )}

      {switcherOpen && (
        <div onClick={() => setSwitcherOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--paper, #fff)', width: '100%', maxWidth: 520, maxHeight: '75vh', overflowY: 'auto', borderRadius: '14px 14px 0 0', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <strong style={{ fontSize: 16 }}>{t('switch_district_title')}</strong>
              <button onClick={() => setSwitcherOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            {cityState && <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--muted)' }}>{cityState}</p>}
            {districtLoading && <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Loading…</p>}
            {(districtList || []).map((name) => {
              const current = name.toLowerCase() === city.toLowerCase();
              return (
                <Link
                  key={name}
                  href={`/city/${encodeURIComponent(name)}?state=${encodeURIComponent(cityState)}`}
                  onClick={() => setSwitcherOpen(false)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 4px',
                    borderTop: '1px solid var(--line)', textDecoration: 'none', fontSize: 15, fontWeight: current ? 800 : 600,
                    color: current ? 'var(--ink)' : 'var(--ink)',
                  }}
                >
                  <span>📍 {name}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{current ? '✓' : '→'}</span>
                </Link>
              );
            })}
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); setSwitcherOpen(false); router.replace('/'); }}
              style={{ display: 'block', marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--line)', textAlign: 'center', fontWeight: 700, fontSize: 14 }}
            >
              {t('change_state_btn')} →
            </a>
          </div>
        </div>
      )}

      {reviewFor && (
        <div onClick={() => setReviewFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--paper, #fff)', width: '100%', maxWidth: 520, maxHeight: '75vh', overflowY: 'auto', borderRadius: '14px 14px 0 0', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 16 }}>{reviewFor.name} — {ratingLabel(reviewFor.ratingCount)}</strong>
              <button onClick={() => setReviewFor(null)} aria-label="Close" style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            {reviewLoading && <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Loading…</p>}
            {!reviewLoading && reviewRows.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>No reviews yet.</p>}
            {reviewRows.map((r) => (
              <div key={r.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                  <Stars value={r.stars} /> <span style={{ marginLeft: 6 }}>{r.reviewer_name || 'Customer'}</span>
                </div>
                {r.review_text && <p style={{ margin: '4px 0 0', fontSize: 14 }}>{r.review_text}</p>}
              </div>
            ))}
            <Link href={`/city/${encodeURIComponent(city)}/${reviewFor.id}`} style={{ display: 'block', marginTop: 12, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
              View full profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
