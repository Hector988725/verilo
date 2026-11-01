'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '../../../../components/LanguageProvider';
import { ShopCard } from '../../../../components/ShopCard';

const PAGE_SIZE = 20; // shops shown at a time; "Show more" adds the next 20

export default function ShopsClient() {
  return (
    <Suspense fallback={<div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>}>
      <ShopsContent />
    </Suspense>
  );
}

function ShopsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const city = decodeURIComponent(params.city);
  const state = searchParams.get('state') || '';
  const pin = /^[1-9]\d{5}$/.test(searchParams.get('pin') || '') ? searchParams.get('pin') : '';
  const [pinOn, setPinOn] = useState(true);

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const sp = new URLSearchParams({ city });
        if (state) sp.set('state', state);
        if (pin) sp.set('pin', pin);
        const res = await fetch('/api/shops?' + sp.toString());
        if (res.ok) {
          const j = await res.json();
          if (!cancelled) setShops(Array.isArray(j.shops) ? j.shops : []);
        }
      } catch (e) {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [city, state, pin]);

  const list = pin && pinOn ? shops.filter((x) => x.pincode === pin) : shops;
  const backHref = `/city/${encodeURIComponent(city)}${(state || pin) ? '?' + [state ? 'state=' + encodeURIComponent(state) : '', pin ? 'pin=' + pin : ''].filter(Boolean).join('&') : ''}`;

  return (
    <div className="wrap">
      <Link
        href={backHref}
        className="back-link"
        onClick={(e) => {
          e.preventDefault();
          // City page se aaye the to history me ek kadam peeche jao (naya entry nahi) — warna replace.
          let from = '';
          try { from = sessionStorage.getItem('verilo_from_city') || ''; sessionStorage.removeItem('verilo_from_city'); } catch (err) {}
          if (from === city && window.history.length > 1) router.back();
          else router.replace(backHref);
        }}
      >← {city}</Link>
      <p style={{ margin: '0 0 14px', fontFamily: "'Rozha One', serif", fontSize: 20 }}>
        {t('shops_label')} · {city}
      </p>

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading...</p>}

      {!loading && list.length === 0 && (
        <div className="empty">
          <div className="empty-title">{lang === 'hi' ? 'अभी कोई दुकान नहीं' : 'No shops yet'}</div>
        </div>
      )}

      {pin && (
        <div style={{ fontSize: 13, margin: '0 0 10px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span>📍 {pinOn ? <>Only PIN <b>{pin}</b></> : <>All of <b>{city}</b></>}</span>
          <button onClick={() => setPinOn((v) => !v)} style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>{pinOn ? `Show all of ${city}` : `Only PIN ${pin}`}</button>
        </div>
      )}
      <div className="shops-grid">
        {list.slice(0, shown).map((s) => (
          <ShopCard key={s.store_id} shop={s} q="" t={t} lang={lang} compact />
        ))}
      </div>

      {list.length > shown && (
        <button
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          style={{ display: 'block', margin: '16px auto 0', padding: '10px 22px', borderRadius: 999, border: '1.5px solid var(--navy)', background: '#fff', color: 'var(--navy)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {t('show_more_shops')} ({list.length - shown})
        </button>
      )}
    </div>
  );
}
