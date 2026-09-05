'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { catLabel, isInTrial, daysLeft } from '../../../../lib/categories';

export default function FindListingPage() {
  const params = useParams();
  const city = decodeURIComponent(params.city);
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    setResults(null);
    const { data: cityRow } = await supabase.from('cities').select('id').eq('name', city).maybeSingle();
    if (!cityRow) { setResults([]); setSearching(false); return; }
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('city_id', cityRow.id)
      .eq('phone', phone.trim());
    setResults(data || []);
    setSearching(false);

    // Mark all found listings as "mine" on this device, so the owner sees
    // payment/trial controls when they open their profile from here.
    try {
      const mine = JSON.parse(localStorage.getItem('verilo_my_listings') || '[]');
      (data || []).forEach((item) => { if (!mine.includes(item.id)) mine.push(item.id); });
      localStorage.setItem('verilo_my_listings', JSON.stringify(mine));
    } catch (e) {}
  }

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href={`/city/${encodeURIComponent(city)}`} className="back-link">← Back to {city} listings</Link>
      </header>

      <div className="form-card">
        <h2 style={{ fontFamily: "'Rozha One', serif", color: '#C97F1E', marginTop: 0 }}>
          Find Your Listing
        </h2>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: -8, marginBottom: 16 }}>
          Enter the phone number you used when you added your listing. You'll be able to
          view your profile, check your trial status, and pay your monthly fee.
        </p>
        <form onSubmit={handleSearch}>
          <label>Your Phone Number</label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit number"
          />
          <button className="btn-primary" type="submit" disabled={searching}>
            {searching ? 'Searching...' : 'Find My Listing'}
          </button>
        </form>
      </div>

      {results !== null && (
        <div style={{ marginTop: 20 }}>
          {results.length === 0 && (
            <div className="empty">
              <div className="empty-title">No listing found</div>
              <div>No listing in {city} is registered with this number.</div>
            </div>
          )}
          {results.map((item) => {
            const trial = isInTrial(item);
            const statusText = trial ? `🟢 Trial — ${daysLeft(item)}d left` : '🔴 Fee due';
            const statusColor = trial ? '#2E6B4E' : '#C1442E';
            return (
              <Link key={item.id} className="card" href={`/city/${encodeURIComponent(city)}/${item.id}/manage`}>
                <div className="card-top">
                  <div className="card-left">
                    <div style={{ minWidth: 0 }}>
                      <div className="card-service">{catLabel(item.service)}</div>
                      <p className="card-name">{item.name}</p>
                      {item.area && <p className="card-area">📍 {item.area}</p>}
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: statusColor, margin: '3px 0 0' }}>
                        {statusText} {!item.is_active && '· ⏸️ Paused'}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: '#C1442E', fontWeight: 700, fontSize: 13.5 }}>Manage →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
