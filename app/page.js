'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { INDIAN_STATES } from '../lib/indianStates';

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState('state'); // 'state' | 'district'
  const [stateQuery, setStateQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [existingDistricts, setExistingDistricts] = useState([]);

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
        <input
          className="city-search"
          placeholder="Search your state..."
          value={stateQuery}
          onChange={(e) => setStateQuery(e.target.value)}
          autoFocus
        />
        <div className="city-list">
          {filteredStates.map((s) => (
            <a key={s} className="city-item" onClick={() => pickState(s)} href="#">{s}</a>
          ))}
          {filteredStates.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13.5, textAlign: 'center' }}>No matching state found.</p>
          )}
        </div>
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
    </div>
  );
}
