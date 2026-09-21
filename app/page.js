'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { INDIAN_STATES } from '../lib/indianStates';
import { shareApp } from '../lib/shareApp';

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
  const [step, setStep] = useState('state'); // 'state' | 'district'
  const [stateQuery, setStateQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [existingDistricts, setExistingDistricts] = useState([]);
  const [locating, setLocating] = useState(false);
  const [locateErr, setLocateErr] = useState('');

  function detectLocation() {
    if (!navigator.geolocation) { setLocateErr('Location is not supported on this browser.'); return; }
    setLocating(true);
    setLocateErr('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { Accept: 'application/json' } }
          );
          const data = await res.json();
          const addr = data?.address || {};
          const detectedState = INDIAN_STATES.find((s) => s.toLowerCase() === (addr.state || '').toLowerCase());
          const detectedDistrict = addr.state_district || addr.county || addr.city_district || addr.city || addr.town;
          if (detectedState && detectedDistrict) {
            router.push('/city/' + encodeURIComponent(detectedDistrict.replace(/\s*District$/i, '').trim()) + '?state=' + encodeURIComponent(detectedState));
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
      { timeout: 10000 }
    );
  }

  const filteredStates = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateQuery.trim().toLowerCase())
  );

  function pickState(state) {
    setSelectedState(state);
    setStep('district');
    supabase.from('cities').select('name').eq('state', state).order('name').then(({ data }) => {
      setExistingDistricts((data || []).map((c) => c.name));
    });
  }

  const filteredDistricts = existingDistricts.filter((d) =>
    d.toLowerCase().includes(districtQuery.trim().toLowerCase())
  );
  const exactMatch = existingDistricts.some((d) => d.toLowerCase() === districtQuery.trim().toLowerCase());

  function goToDistrict(district) {
    router.push('/city/' + encodeURIComponent(district.trim()) + '?state=' + encodeURIComponent(selectedState));
  }

  if (step === 'state') {
    return (
      <div className="city-screen">
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Trusted people in your area — all in one place</p>
        <button
          onClick={detectLocation}
          disabled={locating}
          style={{
            marginTop: 14, background: 'var(--brand-green)', border: 'none', borderRadius: 999, color: '#fff',
            padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 18px rgba(27,110,61,0.28)',
          }}
        >
          📍 {locating ? 'Detecting your location...' : 'Use my current location'}
        </button>
        {locateErr && <p style={{ color: 'var(--vermillion)', fontSize: 12.5, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>{locateErr}</p>}
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '14px 0 4px' }}>— or pick manually —</p>
        <input
          className="city-search"
          placeholder="Search your state..."
          value={stateQuery}
          onChange={(e) => setStateQuery(e.target.value)}
        />
        <div className="city-list">
          {filteredStates.map((s) => (
            <a key={s} className="city-item" onClick={() => pickState(s)} href="#">{s}</a>
          ))}
          {filteredStates.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13.5, textAlign: 'center' }}>No matching state found.</p>
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
          Share Verilo
        </button>
      </div>
    );
  }

  return (
    <div className="city-screen">
      <div className="pin"></div>
      <h1>Verilo</h1>
      <p className="tagline">📍 {selectedState}</p>
      <p
        style={{ fontSize: 12.5, color: 'var(--muted)', cursor: 'pointer', marginBottom: 6, textDecoration: 'underline' }}
        onClick={() => { setStep('state'); setDistrictQuery(''); }}
      >
        ← Change state
      </p>
      <input
        className="city-search"
        placeholder="Search your district/town..."
        value={districtQuery}
        onChange={(e) => setDistrictQuery(e.target.value)}
        autoFocus
      />
      <div className="city-list">
        {filteredDistricts.map((d) => (
          <a key={d} className="city-item" onClick={() => goToDistrict(d)} href="#">{d}</a>
        ))}
      </div>
      {districtQuery.trim() && !exactMatch && (
        <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--marigold-deep)', cursor: 'pointer', fontWeight: 600 }} onClick={() => goToDistrict(districtQuery)}>
          Start a new area for "{districtQuery}" in {selectedState} →
        </p>
      )}
      <ShareButton />
    </div>
  );
}
