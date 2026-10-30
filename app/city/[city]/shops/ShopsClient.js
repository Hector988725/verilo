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

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const sp = new URLSearchParams({ city });
        if (state) sp.set('state', state);
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
  }, [city, state]);

  const backHref = `/city/${encodeURIComponent(city)}${state ? '?state=' + encodeURIComponent(state) : ''}`;

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

      {!loading && shops.length === 0 && (
        <div className="empty">
          <div className="empty-title">{lang === 'hi' ? 'अभी कोई दुकान नहीं' : 'No shops yet'}</div>
        </div>
      )}

      <div className="shops-grid">
        {shops.slice(0, shown).map((s) => (
          <ShopCard key={s.store_id} shop={s} q="" t={t} lang={lang} compact />
        ))}
      </div>

      {shops.length > shown && (
        <button
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          style={{ display: 'block', margin: '16px auto 0', padding: '10px 22px', borderRadius: 999, border: '1.5px solid var(--navy)', background: '#fff', color: 'var(--navy)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {t('show_more_shops')} ({shops.length - shown})
        </button>
      )}
    </div>
  );
}
