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
  if (compact) {
    // Chhota tile: ek line me 2 (phone) / 3 (tablet) / 4 (computer) dukaanein. Poora tile dabane par dukaan khulti hai.
    const sub = [typeLabel, sells].filter(Boolean).join(' · ') || t('shop_word');
    const meta = [items, shop.timings && `🕐 ${shop.timings}`].filter(Boolean).join(' · ');
    return (
      <div className="shop-tile">
        <div className="shop-tile-top">
          <div className="shop-tile-logo">
            {shop.logo_url ? <img src={shop.logo_url} alt="" /> : <span className="listing-photo-fallback" style={{ fontSize: 15 }}>{initials(shop.name)}</span>}
          </div>
          <div className="shop-tile-head">
            <a className="shop-tile-name shop-link" href={shop.order_url} target="_blank" rel="noopener noreferrer">{shop.name}</a>
            <p className="shop-tile-sub" style={{ color: catColor('shops') }}>{sub}</p>
          </div>
        </div>
        {hits.length > 0 && (
          <p className="shop-match">
            {hits.map((p, i) => <span key={i}>{i ? ' · ' : ''}{p.n}{money(p.p)}</span>)}
          </p>
        )}
        {meta && <p className="shop-tile-meta">{meta}</p>}
        <div className="shop-actions">
          <span className="listing-call-btn shop-order-btn">{t('order_online')}</span>
          {shop.maps_url && (
            <a className="listing-call-btn shop-maps-btn" href={shop.maps_url} target="_blank" rel="noopener noreferrer" aria-label="Directions">📍</a>
          )}
        </div>
      </div>
    );
  }
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
