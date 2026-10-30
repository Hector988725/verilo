'use client';
import { useState, useEffect } from 'react';
import { catColor, initials } from '../lib/categories';
import { CategoryIcon } from '../lib/categoryIcons';

export function productHits(shop, q) {
  if (!q) return [];
  return (shop.products || []).filter((p) =>
    `${p.n} ${p.c} ${p.b}`.toLowerCase().includes(q)
  );
}

function money(p) {
  return p == null ? '' : ` ₹${Number(p) % 1 === 0 ? Number(p) : Number(p).toFixed(2)}+`;
}

export function ShopCard({ shop, q, t, lang, compact = false }) {
  const hits = productHits(shop, q).slice(0, 3);
  const typeLabel = shop.business_type ? shop.business_type.charAt(0).toUpperCase() + shop.business_type.slice(1) : '';
  // Ek nazar me: dukaan kis cheez ki hai (top categories), kitni cheezein, kab khuli. Poora card dabane par seedha dukaan khulti hai.
  const sells = shop.categories.slice(0, 3).map((c) => c.name).join(' · ');
  const items = shop.product_count > 0 ? `${shop.product_count}${shop.product_count >= 40 ? '+' : ''} ${lang === 'hi' ? 'चीज़ें' : 'items'}` : '';
  if (compact) return <ShopStory shop={shop} t={t} lang={lang} />;
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
        <span className="listing-call-btn shop-order-btn">{t('order_online')} →</span>
        {shop.maps_url && (
          <a className="listing-call-btn shop-maps-btn" href={shop.maps_url} target="_blank" rel="noopener noreferrer" aria-label="Directions">📍</a>
        )}
      </div>
    </div>
  );
}

function ShopStory({ shop, t, lang }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);
  const typeLabel = shop.business_type ? shop.business_type.charAt(0).toUpperCase() + shop.business_type.slice(1) : '';
  const sells = (shop.categories || []).slice(0, 5).map((c) => c.name);
  const items = shop.product_count > 0 ? `${shop.product_count}${shop.product_count >= 40 ? '+' : ''} ${lang === 'hi' ? 'चीज़ें' : 'items'}` : '';
  return (
    <>
      <button type="button" className="shop-story" onClick={() => setOpen(true)} aria-label={shop.name}>
        <span className="shop-story-ring">
          <span className="shop-story-logo">
            {shop.logo_url ? <img src={shop.logo_url} alt="" /> : <span className="shop-story-initials">{initials(shop.name)}</span>}
          </span>
        </span>
        <span className="shop-story-name">{shop.name}</span>
        <span className="shop-story-btn">{t('shop_now')}</span>
      </button>
      {open && (
        <div className="shop-modal-backdrop" onClick={() => setOpen(false)} role="presentation">
          <div className="shop-modal" role="dialog" aria-modal="true" aria-label={shop.name} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="shop-modal-x" onClick={() => setOpen(false)} aria-label={t('close_word')}>×</button>
            <span className="shop-story-ring shop-modal-ring">
              <span className="shop-story-logo">
                {shop.logo_url ? <img src={shop.logo_url} alt="" /> : <span className="shop-story-initials">{initials(shop.name)}</span>}
              </span>
            </span>
            <h3 className="shop-modal-name">{shop.name}</h3>
            {typeLabel && <p className="shop-modal-type" style={{ color: catColor('shops') }}>{typeLabel}</p>}
            {shop.tagline && <p className="shop-modal-tag">{shop.tagline}</p>}
            {sells.length > 0 && (
              <div className="shop-modal-chips">{sells.map((n) => <span key={n}>{n}</span>)}</div>
            )}
            <div className="shop-modal-facts">
              {items && <p>🛍️ {items}</p>}
              {shop.timings && <p>🕐 {shop.timings}</p>}
              {shop.address && <p>📍 {shop.address}</p>}
            </div>
            <a className="shop-modal-go" href={shop.order_url} target="_blank" rel="noopener noreferrer">🛒 {t('shop_now')}</a>
            {shop.maps_url && (
              <a className="shop-modal-dir" href={shop.maps_url} target="_blank" rel="noopener noreferrer">{t('directions_word')}</a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
