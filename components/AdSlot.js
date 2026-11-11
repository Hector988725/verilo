'use client';
import { useEffect, useRef, useState } from 'react';
import { adHref } from '../lib/adsUtil';

const IMAGE_MS = 8000;      // image kitni der dikhe (agar kai ads hon)
const VIDEO_MAX_MS = 17000; // video 15 sec tak; safety ke liye thoda zyada

function ping(adId, type, city) {
  try {
    fetch('/api/ads/event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id: adId, event_type: type, city }), keepalive: true,
    }).catch(() => {});
  } catch (e) { /* ignore */ }
}
function seen(id) { try { return sessionStorage.getItem('ad_v_' + id) === '1'; } catch (e) { return false; } }
function markSeen(id) { try { sessionStorage.setItem('ad_v_' + id, '1'); } catch (e) { /* ignore */ } }

// Shehar ke hisaab ka ad: image ya chhota video. Video bina awaaz ke apne aap chalta hai;
// awaaz sirf 🔊 dabane par (browser ka rule). Ad na ho to kuch nahi dikhta (jagah nahi ghirti).
export default function AdSlot({ city }) {
  const [ads, setAds] = useState([]);
  const [idx, setIdx] = useState(0);
  const [sound, setSound] = useState(false);
  const [inView, setInView] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [manualPlay, setManualPlay] = useState(false);
  const boxRef = useRef(null);
  const vidRef = useRef(null);

  useEffect(() => {
    let off = false;
    try { setSound(sessionStorage.getItem('ad_sound') === '1'); } catch (e) { /* ignore */ }
    try { const c = navigator.connection; setDataSaver(!!(c && c.saveData)); } catch (e) { /* ignore */ }
    fetch('/api/ads?city=' + encodeURIComponent(city || ''))
      .then((r) => (r.ok ? r.json() : { ads: [] }))
      .then((j) => {
        if (off || !j || !Array.isArray(j.ads)) return;
        // zyada priority wale ko pehle; baaki ko ghuma do taaki sabko mauka mile
        const arr = [...j.ads].sort((a, b) => (b.priority - a.priority) || (Math.random() - 0.5));
        setAds(arr);
      })
      .catch(() => {});
    return () => { off = true; };
  }, [city]);

  // sirf screen par dikhe tab chalao (data aur battery bachti hai)
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= 0.4), { threshold: [0, 0.4, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [ads.length]);

  const ad = ads.length ? ads[idx % ads.length] : null;

  // view gintee (ek session me ek ad ek hi baar)
  useEffect(() => {
    if (ad && inView && !seen(ad.id)) { markSeen(ad.id); ping(ad.id, 'view', city); }
  }, [ad, inView, city]);

  // agla ad
  useEffect(() => {
    if (!ad || ads.length < 2 || !inView) return undefined;
    const ms = ad.media_type === 'video' ? VIDEO_MAX_MS : IMAGE_MS;
    const t = setTimeout(() => { setManualPlay(false); setIdx((i) => i + 1); }, ms);
    return () => clearTimeout(t);
  }, [ad, ads.length, inView]);

  // video: dikhe to chale, na dikhe to ruke
  useEffect(() => {
    const v = vidRef.current;
    if (!v || !ad || ad.media_type !== 'video') return;
    v.muted = !sound;
    const allowed = inView && (!dataSaver || manualPlay);
    if (allowed) {
      const p = v.play();
      if (p && p.catch) p.catch(() => { v.muted = true; setSound(false); v.play().catch(() => {}); });
    } else {
      v.pause();
    }
  }, [ad, inView, sound, dataSaver, manualPlay]);

  if (!ad) return null;
  const href = adHref(ad);
  const isVideo = ad.media_type === 'video';

  function open() {
    ping(ad.id, 'click', city);
    if (!href) return;
    if (href.startsWith('tel:')) window.location.href = href;
    else window.open(href, '_blank', 'noopener,noreferrer');
  }
  function toggleSound(e) {
    e.stopPropagation();
    const next = !sound;
    setSound(next);
    try { sessionStorage.setItem('ad_sound', next ? '1' : '0'); } catch (err) { /* ignore */ }
    if (next) ping(ad.id, 'unmute', city);
  }

  const chip = { position: 'absolute', background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, padding: '3px 8px', borderRadius: 999 };
  return (
    <div ref={boxRef} style={{ margin: '0 0 16px' }}>
      <div
        role={href ? 'link' : undefined}
        tabIndex={href ? 0 : undefined}
        aria-label={ad.title || 'Sponsored'}
        onClick={href ? open : undefined}
        onKeyDown={href ? (e) => { if (e.key === 'Enter') open(); } : undefined}
        style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#111', aspectRatio: '16 / 9', maxHeight: 210, width: '100%', cursor: href ? 'pointer' : 'default', border: '1px solid var(--line)' }}
      >
        {isVideo ? (
          <video
            key={ad.id} ref={vidRef} src={ad.media_url} poster={ad.poster_url || undefined}
            muted={!sound} playsInline preload={dataSaver ? 'none' : 'metadata'} loop={ads.length < 2}
            onEnded={() => { if (ads.length > 1) setIdx((i) => i + 1); }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={ad.id} src={ad.media_url} alt={ad.title || 'Sponsored'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <span style={{ ...chip, top: 8, left: 8 }}>Sponsored</span>
        {isVideo && (
          <button type="button" onClick={toggleSound} aria-label={sound ? 'Mute' : 'Sound on'}
            style={{ ...chip, bottom: 8, right: 8, border: 'none', cursor: 'pointer', fontSize: 15, padding: '5px 10px', lineHeight: 1 }}>
            {sound ? '🔊' : '🔇'}
          </button>
        )}
        {isVideo && dataSaver && !manualPlay && (
          <button type="button" onClick={(e) => { e.stopPropagation(); setManualPlay(true); }} aria-label="Play"
            style={{ position: 'absolute', inset: 0, margin: 'auto', width: 54, height: 54, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 22, cursor: 'pointer' }}>▶</button>
        )}
        {ads.length > 1 && (
          <span style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', gap: 5, justifyContent: 'center', pointerEvents: 'none' }}>
            {ads.map((a, i) => (
              <i key={a.id} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx % ads.length ? '#fff' : 'rgba(255,255,255,.45)' }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
