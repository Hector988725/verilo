'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminCitiesPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('verilo_admin_ok') === '1') {
      setUnlocked(true);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passInput }),
    });
    if (res.ok) {
      localStorage.setItem('verilo_admin_ok', '1');
      setUnlocked(true);
    } else {
      setLoginError('Wrong passcode');
    }
  }

  async function handleLogout() {
    try { await fetch('/api/admin/logout', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem('verilo_admin_ok');
    setUnlocked(false);
    setPassInput('');
  }

  useEffect(() => {
    if (!unlocked) return;
    loadCities();
  }, [unlocked]);

  async function loadCities() {
    setLoading(true);
    const res = await fetch('/api/admin/cities-list');
    if (res.status === 401) {
      localStorage.removeItem('verilo_admin_ok');
      setUnlocked(false);
      setLoading(false);
      return;
    }
    const result = await res.json();
    setCities(result.cities || []);
    setLoading(false);
  }

  async function deleteCity(city) {
    if (!confirm(`Delete "${city.name}"${city.state ? `, ${city.state}` : ''}? This cannot be undone.`)) return;
    setActionError('');
    setDeletingId(city.id);
    const res = await fetch('/api/admin/cities-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: city.id }),
    });
    const result = await res.json();
    setDeletingId(null);
    if (!res.ok) { setActionError(result.error || 'Could not delete this city.'); return; }
    setCities((prev) => prev.filter((c) => c.id !== city.id));
  }

  const filtered = cities.filter((c) =>
    !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (!unlocked) {
    return (
      <div className="wrap" style={{ maxWidth: 380 }}>
        <header>
          <div className="pin"></div>
          <h1>Verilo</h1>
          <p className="tagline">Admin — City Cleanup</p>
        </header>
        <div className="form-card">
          <form onSubmit={handleLogin}>
            <label>Passcode</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                autoFocus
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? 'Hide passcode' : 'Show passcode'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                  color: 'var(--muted)', padding: 4, lineHeight: 1,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {loginError && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{loginError}</p>}
            <button className="btn-primary" type="submit">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Owner Dashboard — City Cleanup</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin/due" className="back-link">Due List</Link>
          <Link href="/admin/reports" className="back-link">Reports</Link>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid var(--line)', borderRadius: 6,
              color: 'var(--muted)', fontSize: 12.5, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            🔒 Logout
          </button>
        </div>
      </header>

      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 14 }}>
        Only cities with <strong>0 listings</strong> can be deleted — a safeguard against ever
        losing a real listing. If a city has listings but is a duplicate/typo, move those listings
        to the correct city first (via SQL in Supabase), then delete it here.
      </p>

      <input className="search-bar" placeholder="Search city name..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {actionError && (
        <p style={{ color: 'var(--vermillion)', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{actionError}</p>
      )}

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading...</p>}

      {!loading && filtered.map((c) => (
        <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <p className="card-name" style={{ marginBottom: 2 }}>{c.name}</p>
            <p className="card-area">{c.state || 'No state set'} · {c.listing_count} listing{c.listing_count === 1 ? '' : 's'}</p>
          </div>
          <button
            onClick={() => deleteCity(c)}
            disabled={c.listing_count > 0 || deletingId === c.id}
            style={{
              flex: '0 0 auto', padding: '8px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13,
              cursor: c.listing_count > 0 ? 'not-allowed' : 'pointer',
              background: c.listing_count > 0 ? 'rgba(0,0,0,0.06)' : 'var(--vermillion)',
              color: c.listing_count > 0 ? 'var(--muted)' : '#fff',
            }}
          >
            {deletingId === c.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}