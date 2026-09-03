'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState([]);

  useEffect(() => {
    supabase.from('cities').select('name').order('name').then(({ data }) => {
      if (data) setCities(data.map((c) => c.name));
    });
  }, []);

  const filtered = cities.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()));
  const exactMatch = cities.some((c) => c.toLowerCase() === query.trim().toLowerCase());

  function goToCity(city) {
    router.push('/city/' + encodeURIComponent(city.trim()));
  }

  return (
    <div className="city-screen">
      <div className="pin"></div>
      <h1>Verilo</h1>
      <p className="tagline">Trusted people in your area — all in one place</p>
      <input
        className="city-search"
        placeholder="Search your city/area..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="city-list">
        {filtered.map((c) => (
          <a key={c} className="city-item" onClick={() => goToCity(c)} href="#">📍 {c}</a>
        ))}
      </div>
      {query.trim() && !exactMatch && (
        <p style={{ marginTop: 16, fontSize: 13.5, color: '#E8A33D', cursor: 'pointer' }} onClick={() => goToCity(query)}>
          Start a new area for "{query}" →
        </p>
      )}
    </div>
  );
}
