'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { compressImage } from '../../../lib/compressImage';
import { adHref } from '../../../lib/adsUtil';

const EMPTY = { id: null, advertiser: '', title: '', media_type: 'image', media_url: '', poster_url: '', link_type: 'whatsapp', link_value: '', allCities: true, cities: [], starts_on: '', ends_on: '', priority: 0 };
const MAX_SEC = 15.5;
const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--line-strong)', fontSize: 14, background: '#fff', color: 'var(--ink)' };
const label = { display: 'block', fontSize: 12.5, fontWeight: 700, margin: '12px 0 4px', color: 'var(--ink)' };

async function jpegPoster(file) {
  // video ka ek frame nikaal kar chhota poster banata hai (data bachane ke liye)
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = rej; });
    v.currentTime = Math.min(0.4, (v.duration || 1) / 2);
    await new Promise((res) => { v.onseeked = res; setTimeout(res, 1500); });
    const scale = Math.min(1, 640 / (v.videoWidth || 640));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round((v.videoWidth || 640) * scale));
    c.height = Math.max(1, Math.round((v.videoHeight || 360) * scale));
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.75));
  } catch (e) { return null; } finally { URL.revokeObjectURL(url); }
}
function videoSeconds(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); resolve(NaN); };
    v.src = url;
  });
}

export default function AdsAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [cityNames, setCityNames] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  useEffect(() => { if (typeof window !== 'undefined' && localStorage.getItem('verilo_admin_ok') === '1') setUnlocked(true); }, []);
  useEffect(() => { if (unlocked) { load(); loadCities(); } }, [unlocked]);

  async function handleLogin(e) {
    e.preventDefault();
    if (signingIn) return;
    setLoginError(''); setSigningIn(true);
    let res = null;
    try { res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode: passInput }) }); } catch (err) { res = null; }
    setSigningIn(false);
    if (!res) setLoginError('Network problem, please try again');
    else if (res.ok) { localStorage.setItem('verilo_admin_ok', '1'); setUnlocked(true); }
    else setLoginError('Wrong passcode');
  }
  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/ads');
    if (res.status === 401) { localStorage.removeItem('verilo_admin_ok'); setUnlocked(false); setLoading(false); return; }
    const j = await res.json();
    setAds(j.ads || []); setLoading(false);
  }
  async function loadCities() {
    try {
      const r = await fetch('/api/admin/cities-list');
      const j = await r.json();
      const names = [...new Set((j.cities || []).map((c) => c.name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      setCityNames(names);
    } catch (e) { /* ignore */ }
  }
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function signedUpload(kind, file, ext) {
    const r = await fetch('/api/admin/ads/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, ext, size: file.size }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Upload link nahi bana');
    const { error } = await supabase.storage.from('ad-media').uploadToSignedUrl(j.path, j.token, file, { contentType: file.type || undefined });
    if (error) throw new Error(error.message);
    return j.publicUrl;
  }

  async function onFile(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setMsg('');
    try {
      if (f.type.startsWith('video/')) {
        if (!/\.(mp4|webm)$/i.test(f.name)) throw new Error('Video sirf MP4 ya WebM chahiye');
        if (f.size > 5 * 1024 * 1024) throw new Error('Video 5 MB se chhota chahiye (480p/720p, 15 second)');
        setBusy('Video check ho raha hai...');
        const sec = await videoSeconds(f);
        if (!(sec > 0)) throw new Error('Video padha nahi ja saka');
        if (sec > MAX_SEC) throw new Error(`Video ${Math.round(sec)} second ka hai. 15 second tak ka chahiye.`);
        setBusy('Video upload ho raha hai...');
        const url = await signedUpload('video', f, f.name.split('.').pop());
        let poster = '';
        const pb = await jpegPoster(f);
        if (pb) { const pf = new File([pb], 'poster.jpg', { type: 'image/jpeg' }); try { poster = await signedUpload('poster', pf, 'jpg'); } catch (er) { poster = ''; } }
        setForm((s) => ({ ...s, media_type: 'video', media_url: url, poster_url: poster }));
      } else if (f.type.startsWith('image/')) {
        setBusy('Image upload ho rahi hai...');
        const small = await compressImage(f, 1280, 0.82);
        if (small.size > 2 * 1024 * 1024) throw new Error('Image 2 MB se chhoti chahiye');
        const url = await signedUpload('image', small, (small.name.split('.').pop() || 'jpg'));
        setForm((s) => ({ ...s, media_type: 'image', media_url: url, poster_url: '' }));
      } else {
        throw new Error('Sirf image ya video chunein');
      }
      setMsg('✅ File upload ho gayi');
    } catch (err) { setMsg('❌ ' + err.message); }
    setBusy('');
  }

  async function save() {
    if (busy) { setMsg('⏳ Thoda ruko, upload chal raha hai...'); return; }
    if (!form.media_url) { setMsg('❌ Pehle video/image chunkar upload karo (1 number wala box) aur "✅ File upload ho gayi" aane tak ruko'); return; }
    if (!form.advertiser.trim()) { setMsg('❌ Advertiser ka naam likho (dukaan/business ka naam)'); return; }
    if (!form.allCities && form.cities.length === 0) { setMsg('❌ Koi city chuno ya "Sabhi cities" tick karo'); return; }
    setMsg(''); setBusy('Save ho raha hai...');
    const body = {
      action: form.id ? 'update' : 'create', id: form.id, advertiser: form.advertiser, title: form.title, media_type: form.media_type,
      media_url: form.media_url, poster_url: form.poster_url, link_type: form.link_type, link_value: form.link_value,
      cities: form.allCities ? [] : form.cities, starts_on: form.starts_on, ends_on: form.ends_on, priority: form.priority,
    };
    let r, j;
    try {
      r = await fetch('/api/admin/ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      j = await r.json().catch(() => ({}));
    } catch (e) { setBusy(''); setMsg('❌ Internet/server error: ' + e.message); return; }
    setBusy('');
    if (!r.ok) { setMsg('❌ ' + (j.error || 'Save nahi hua')); return; }
    setMsg('✅ Save ho gaya'); setForm(EMPTY); load();
  }
  async function act(a, extra) {
    const r = await fetch('/api/admin/ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, ...extra }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); alert(j.error || 'Nahi hua'); }
    load();
  }
  function edit(a) {
    setForm({ id: a.id, advertiser: a.advertiser, title: a.title || '', media_type: a.media_type, media_url: a.media_url, poster_url: a.poster_url || '',
      link_type: a.link_type, link_value: a.link_value || '', allCities: !(a.cities && a.cities.length), cities: a.cities || [], starts_on: a.starts_on || '', ends_on: a.ends_on || '', priority: a.priority || 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const toggleCity = (n) => setForm((f) => ({ ...f, cities: f.cities.includes(n) ? f.cities.filter((x) => x !== n) : [...f.cities, n] }));
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const state = (a) => (!a.is_active ? ['Band', '#8A94A6'] : a.ends_on && a.ends_on < today ? ['Khatam', '#9C2E20'] : a.starts_on && a.starts_on > today ? ['Aane wala', '#8C6224'] : ['Chal raha hai', '#14342A']);

  if (!unlocked) {
    return (
      <div className="wrap" style={{ maxWidth: 400, paddingTop: 80 }}>
        <div className="form-card">
          <h2 style={{ fontFamily: "'Rozha One', serif", color: '#8C6224', marginTop: 0 }}>Owner Login</h2>
          <form onSubmit={handleLogin}>
            <label>Passcode</label>
            <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} autoFocus />
            {loginError && <p style={{ color: '#9C2E20', fontSize: 13, marginTop: 8 }}>{loginError}</p>}
            <button className="btn-primary" type="submit" disabled={signingIn}>{signingIn ? 'Checking...' : 'Enter'}</button>
          </form>
        </div>
      </div>
    );
  }

  const shownCities = cityNames.filter((n) => n.toLowerCase().includes(cityFilter.trim().toLowerCase())).slice(0, 80);
  const canSave = form.advertiser.trim() && form.media_url && !busy;
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Owner Dashboard — Ads</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin/reports" className="back-link">Reports →</Link>
          <Link href="/admin/due" className="back-link">Due List →</Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="back-link">View site ↗</a>
        </div>
      </header>

      <div className="form-card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>{form.id ? '✏️ Ad badlo' : '➕ Naya ad'}</h3>

        <span style={label}>1. Image ya video (video 15 second tak, 5 MB tak)</span>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={onFile} disabled={!!busy} />
        {form.media_url && (
          <div style={{ marginTop: 8, maxWidth: 320, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
            {form.media_type === 'video'
              ? <video src={form.media_url} poster={form.poster_url || undefined} controls muted playsInline style={{ width: '100%', display: 'block' }} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={form.media_url} alt="preview" style={{ width: '100%', display: 'block' }} />}
          </div>
        )}
        {busy && <p style={{ fontSize: 13, color: '#8C6224' }}>⏳ {busy}</p>}
        {msg && <p style={{ fontSize: 13 }}>{msg}</p>}

        <span style={label}>2. Advertiser (dukaan / business ka naam)</span>
        <input style={input} value={form.advertiser} onChange={(e) => set('advertiser', e.target.value)} maxLength={80} />
        <span style={label}>3. Chhota title (optional)</span>
        <input style={input} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} />

        <span style={label}>4. Ad par tap karne par kya ho</span>
        <select style={input} value={form.link_type} onChange={(e) => set('link_type', e.target.value)}>
          <option value="whatsapp">WhatsApp khule</option>
          <option value="call">Call lage</option>
          <option value="link">Website khule (https://)</option>
          <option value="none">Kuch nahi (sirf dikhana)</option>
        </select>
        {form.link_type !== 'none' && (
          <input style={{ ...input, marginTop: 8 }} value={form.link_value} onChange={(e) => set('link_value', e.target.value)}
            placeholder={form.link_type === 'link' ? 'https://...' : '10 digit mobile number'} inputMode={form.link_type === 'link' ? 'url' : 'tel'} />
        )}
        {form.link_type !== 'none' && <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>Tap par jayega: {adHref({ link_type: form.link_type, link_value: form.link_value }) || '— (sahi number/link daalo)'}</p>}

        <span style={label}>5. Kis shehar me dikhana hai</span>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <input type="checkbox" checked={form.allCities} onChange={(e) => set('allCities', e.target.checked)} /> Sab shehar
        </label>
        {!form.allCities && (
          <div style={{ marginTop: 8 }}>
            <input style={input} placeholder="Shehar dhundo..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
              {shownCities.map((n) => (
                <button key={n} type="button" onClick={() => toggleCity(n)}
                  style={{ padding: '5px 10px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', border: '1.5px solid #14342A', background: form.cities.includes(n) ? '#14342A' : '#fff', color: form.cities.includes(n) ? '#fff' : '#14342A' }}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12.5, margin: '6px 0 0' }}>Chune: {form.cities.length ? form.cities.join(', ') : 'koi nahi (shehar chuno)'}</p>
          </div>
        )}

        <span style={label}>6. Kab se kab tak (khali = hamesha)</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <input style={input} type="date" value={form.starts_on} onChange={(e) => set('starts_on', e.target.value)} />
          <input style={input} type="date" value={form.ends_on} onChange={(e) => set('ends_on', e.target.value)} />
        </div>

        <span style={label}>7. Priority (0 = normal, 10 = sabse pehle)</span>
        <input style={{ ...input, maxWidth: 120 }} type="number" min={0} max={10} value={form.priority} onChange={(e) => set('priority', e.target.value)} />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn-primary" type="button" onClick={save} disabled={!!busy}>{form.id ? 'Update karo' : 'Ad chalu karo'}</button>
          {form.id && <button type="button" onClick={() => { setForm(EMPTY); setMsg(''); }} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line-strong)', background: '#fff', cursor: 'pointer' }}>Cancel</button>}
        </div>
        {msg && <p style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>{msg}</p>}
      </div>

      <h3>Sab ads {loading ? '...' : `(${ads.length})`}</h3>
      {!loading && ads.length === 0 && <div className="empty"><div className="empty-title">Abhi koi ad nahi</div><div>Upar se pehla ad jodo.</div></div>}
      {ads.map((a) => {
        const [st, col] = state(a);
        return (
          <div key={a.id} className="card" style={{ cursor: 'default', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 110, flex: 'none', borderRadius: 8, overflow: 'hidden', background: '#111', aspectRatio: '16 / 9' }}>
                {a.media_type === 'video'
                  // eslint-disable-next-line @next/next/no-img-element
                  ? (a.poster_url ? <img src={a.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontSize: 12, padding: 6, display: 'block' }}>🎬 video</span>)
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={a.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{a.advertiser}{a.title ? ` — ${a.title}` : ''}</div>
                <div style={{ fontSize: 12.5, color: col, fontWeight: 700 }}>● {st}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  📍 {a.cities && a.cities.length ? a.cities.join(', ') : 'Sab shehar'} · 📅 {a.starts_on || 'abhi se'} → {a.ends_on || 'hamesha'}
                </div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>👁 {a.views} view · 👆 {a.clicks} click{a.media_type === 'video' ? ` · 🔊 ${a.unmutes} awaaz` : ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => act(a, { action: 'toggle', is_active: !a.is_active })} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line-strong)', background: '#fff', cursor: 'pointer' }}>{a.is_active ? '⏸ Band karo' : '▶ Chalu karo'}</button>
              <button type="button" onClick={() => edit(a)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line-strong)', background: '#fff', cursor: 'pointer' }}>✏️ Badlo</button>
              <button type="button" onClick={() => { if (confirm('Ye ad hamesha ke liye hata dein? (uski gintee bhi hat jayegi)')) act(a, { action: 'delete' }); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #9C2E20', color: '#9C2E20', background: '#fff', cursor: 'pointer' }}>🗑 Hatao</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
