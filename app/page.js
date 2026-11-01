'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { INDIAN_STATES } from '../lib/indianStates';
import { shareApp } from '../lib/shareApp';
import { useLanguage } from '../components/LanguageProvider';

function LangToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', border: '1.5px solid var(--line-strong)', borderRadius: 999, overflow: 'hidden' }}>
      <button onClick={() => setLang('en')} style={{ padding: '5px 11px', fontSize: 11.5, fontWeight: 700, border: 'none', cursor: 'pointer', background: lang === 'en' ? 'var(--navy)' : 'transparent', color: lang === 'en' ? '#fff' : 'var(--muted)' }}>EN</button>
      <button onClick={() => setLang('hi')} style={{ padding: '5px 11px', fontSize: 11.5, fontWeight: 700, border: 'none', cursor: 'pointer', background: lang === 'hi' ? 'var(--navy)' : 'transparent', color: lang === 'hi' ? '#fff' : 'var(--muted)' }}>हिं</button>
    </div>
  );
}

function ShareButton() {
  return (
    <button
      onClick={shareApp}
      style={{
        marginTop: 22, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 999,
        padding: '9px 18px', fontSize: 13, fontWeight: 700, color: 'var(--muted)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow)',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="2.8" /><circle cx="6" cy="12" r="2.8" /><circle cx="18" cy="19" r="2.8" />
        <path d="M8.4 10.7 15.6 6.6M8.4 13.3l7.2 4.1" />
      </svg>
      Share Verilo
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState('state'); // 'state' | 'district'
  const [addIntent, setAddIntent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAddIntent(new URLSearchParams(window.location.search).get('next') === 'add');
    }
  }, []);
  const [stateQuery, setStateQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [existingDistricts, setExistingDistricts] = useState([]);
  const [locating, setLocating] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [lastCity, setLastCity] = useState(null);
  useEffect(() => {
    try { const c = JSON.parse(localStorage.getItem('verilo_last_city') || 'null'); if (c && c.city) setLastCity(c); } catch (e) {}
  }, []);
  // Detecting 5 second se zyada chale to manual chunne ka hint dikhao.
  useEffect(() => {
    if (!locating) { setSlowHint(false); return; }
    const id = setTimeout(() => setSlowHint(true), 5000);
    return () => clearTimeout(id);
  }, [locating]);
  const [locateErr, setLocateErr] = useState('');
  const [navigating, setNavigating] = useState('');
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [pin, setPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [pinErr, setPinErr] = useState('');

  // PIN code se seedha apna ilaka: server se district + state nikal kar us city ke page par, ?pin= ke saath.
  async function goPin(e) {
    if (e) e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) { setPinErr('Enter a valid 6-digit PIN code.'); return; }
    setPinBusy(true); setPinErr('');
    try {
      const res = await fetch('/api/pincode?pin=' + pin);
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.city) { setPinErr(j.error || 'PIN code not found. Please pick your state and district below.'); setPinBusy(false); return; }
      const base = '/city/' + encodeURIComponent(j.city);
      const qs = '?' + (j.state ? 'state=' + encodeURIComponent(j.state) + '&' : '') + 'pin=' + pin;
      router.push(addIntent ? `${base}/add${qs}` : `${base}${qs}`);
    } catch (err) {
      setPinErr('Could not check the PIN code. Please check your internet or pick your state below.');
      setPinBusy(false);
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) { setLocateErr('Location is not supported on this browser.'); return; }
    setLocating(true);
    setLocateErr('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Wahi ~5 km ka ilaka pehle detect ho chuka ho to network ke bina turant wahi jawab.
          const cellKey = `verilo_geo_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
          let data = null;
          try { data = JSON.parse(localStorage.getItem(cellKey) || 'null'); } catch (e) {}
          if (!data) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 7000);
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                { headers: { Accept: 'application/json' }, signal: ctrl.signal }
              );
              data = await res.json();
              try { if (data && data.address) localStorage.setItem(cellKey, JSON.stringify({ address: data.address })); } catch (e) {}
            } finally { clearTimeout(timer); }
          }
          const addr = data?.address || {};
          const detectedState = INDIAN_STATES.find((s) => s.toLowerCase() === (addr.state || '').toLowerCase());
          const detectedDistrict = addr.state_district || addr.county || addr.city_district || addr.city || addr.town;
          if (detectedState && detectedDistrict) {
            const cleanDistrict = detectedDistrict.replace(/\s*District$/i, '').trim();
            const base = '/city/' + encodeURIComponent(cleanDistrict);
            const qs = '?state=' + encodeURIComponent(detectedState);
            router.push(addIntent ? `${base}/add${qs}` : `${base}${qs}`);
          } else if (detectedState) {
            pickState(detectedState);
          } else {
            setLocateErr("Couldn't detect your area. Please pick your state manually.");
          }
        } catch (e) {
          setLocateErr("Couldn't detect your area. Please pick your state manually.");
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); setLocateErr('Location permission denied. Please pick your state manually.'); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }

  const filteredStates = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateQuery.trim().toLowerCase())
  );

  function pickState(state) {
    setSelectedState(state);
    setStep('district');
    setExistingDistricts([]);
    setLoadingDistricts(true);
    supabase.from('cities').select('name').eq('state', state).order('name').then(({ data }) => {
      setExistingDistricts((data || []).map((c) => c.name));
      setLoadingDistricts(false);
    }, () => setLoadingDistricts(false));
  }

  const filteredDistricts = existingDistricts.filter((d) =>
    d.toLowerCase().includes(districtQuery.trim().toLowerCase())
  );
  const exactMatch = existingDistricts.some((d) => d.toLowerCase() === districtQuery.trim().toLowerCase());

  function goToDistrict(district) {
    if (navigating) return;
    setNavigating(district.trim());
    const base = '/city/' + encodeURIComponent(district.trim());
    const qs = '?state=' + encodeURIComponent(selectedState);
    router.push(addIntent ? `${base}/add${qs}` : `${base}${qs}`);
  }

  if (step === 'state') {
    return (
      <div className="city-screen" style={{ position: 'relative' }}>
        <LangToggle />
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">{t('tagline_home')}</p>
        <button
          onClick={detectLocation}
          disabled={locating}
          style={{
            marginTop: 14, background: 'var(--brand-green)', border: 'none', borderRadius: 999, color: '#fff',
            padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 18px rgba(27,110,61,0.28)',
          }}
        >
          📍 {locating ? t('detecting_location') : t('use_my_location')}
        </button>
        {locating && slowHint && <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>Thoda time lag raha hai… chaho to neeche se apna state chun lo.</p>}
        {lastCity && !locating && (
          <button
            onClick={() => {
              const base = '/city/' + encodeURIComponent(lastCity.city);
              const qs = (lastCity.state ? '?state=' + encodeURIComponent(lastCity.state) : '') + (lastCity.pin ? (lastCity.state ? '&' : '?') + 'pin=' + lastCity.pin : '');
              router.push(addIntent ? `${base}/add${qs}` : `${base}${qs}`);
            }}
            style={{ marginTop: 10, background: 'var(--paper)', border: '1.5px solid var(--brand-green)', borderRadius: 999, color: 'var(--brand-green)', padding: '9px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            ↩ {lastCity.pin ? `${lastCity.pin} · ` : ''}{lastCity.city}{lastCity.state ? `, ${lastCity.state}` : ''}
          </button>
        )}
        {locateErr && <p style={{ color: 'var(--vermillion)', fontSize: 12.5, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>{locateErr}</p>}
        <form onSubmit={goPin} style={{ display: 'flex', gap: 8, marginTop: 12, width: '100%', maxWidth: 320 }}>
          <input
            className="city-search"
            style={{ flex: 1, margin: 0 }}
            placeholder="Enter your PIN code"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinErr(''); }}
            aria-label="PIN code"
          />
          <button type="submit" disabled={pinBusy} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 999, padding: '0 18px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>{pinBusy ? '…' : 'Go'}</button>
        </form>
        {pinErr && <p style={{ color: 'var(--vermillion)', fontSize: 12.5, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>{pinErr}</p>}
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '14px 0 4px' }}>{t('or_pick_manually')}</p>
        <input
          className="city-search"
          placeholder={t('search_state')}
          value={stateQuery}
          onChange={(e) => setStateQuery(e.target.value)}
        />
        <div className="city-list">
          {filteredStates.map((s) => (
            <a key={s} className="city-item" onClick={(e) => { e.preventDefault(); pickState(s); }} href="#">{s}</a>
          ))}
          {filteredStates.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13.5, textAlign: 'center' }}>{t('no_matching_state')}</p>
          )}
        </div>
        <button
          onClick={shareApp}
          style={{
            marginTop: 22, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 999,
            padding: '9px 18px', fontSize: 13, fontWeight: 700, color: 'var(--muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="2.8" /><circle cx="6" cy="12" r="2.8" /><circle cx="18" cy="19" r="2.8" />
            <path d="M8.4 10.7 15.6 6.6M8.4 13.3l7.2 4.1" />
          </svg>
          {t('share_verilo')}
        </button>
      </div>
    );
  }

  return (
    <div className="city-screen" style={{ position: 'relative' }}>
      <LangToggle />
      <div className="pin"></div>
      <h1>Verilo</h1>
      <p className="tagline">📍 {selectedState}</p>
      <p
        style={{ fontSize: 12.5, color: 'var(--muted)', cursor: 'pointer', marginBottom: 6, textDecoration: 'underline' }}
        onClick={() => { setStep('state'); setDistrictQuery(''); }}
      >
        {t('change_state')}
      </p>
      <input
        className="city-search"
        placeholder={t('search_district')}
        value={districtQuery}
        onChange={(e) => setDistrictQuery(e.target.value)}
        autoFocus
      />
      <div className="city-list">
        {filteredDistricts.map((d) => (
          <a key={d} className="city-item" onClick={(e) => { e.preventDefault(); goToDistrict(d); }} href="#" style={navigating === d ? { opacity: 0.6 } : undefined}>{d}{navigating === d ? ' — opening…' : ''}</a>
        ))}
        {loadingDistricts && <p style={{ color: 'var(--muted)', fontSize: 13.5, textAlign: 'center' }}>Loading…</p>}
      </div>
      {districtQuery.trim() && !exactMatch && (
        <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--marigold-deep)', cursor: 'pointer', fontWeight: 600 }} onClick={() => goToDistrict(districtQuery)}>
          {t('start_new_area')} "{districtQuery}" {selectedState} →
        </p>
      )}
      <ShareButton />
    </div>
  );
}
