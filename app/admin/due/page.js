'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { catLabel } from '../../../lib/categories';

export default function DueListPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

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
      localStorage.setItem('verilo_admin_ok', '1'); // convenience flag only — real check is server-side
      setUnlocked(true);
    } else {
      setLoginError('Wrong passcode');
    }
  }

  useEffect(() => {
    if (!unlocked) return;
    loadListings();
  }, [unlocked]);

  async function loadListings() {
    setLoading(true);
    const res = await fetch('/api/admin/due-list');
    if (res.status === 401) {
      localStorage.removeItem('verilo_admin_ok');
      setUnlocked(false);
      setLoading(false);
      return;
    }
    const result = await res.json();
    setListings(result.listings || []);
    setLoading(false);
  }

  async function adminTogglePause(item) {
    await fetch('/api/admin/toggle-pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: item.id, is_active: !item.is_active }),
    });
    loadListings();
  }

  async function copyManageLink(item) {
    try {
      const res = await fetch('/api/admin/manage-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: item.id }),
      });
      const result = await res.json();
      if (result.link) {
        await navigator.clipboard.writeText(result.link);
        alert(`Link copied! Paste it to ${item.name} on WhatsApp:\n\n${result.link}`);
      } else {
        alert('Could not fetch link.');
      }
    } catch (e) {
      alert('Something went wrong.');
    }
  }

  if (!unlocked) {
    return (
      <div className="wrap" style={{ maxWidth: 400, paddingTop: 80 }}>
        <div className="form-card">
          <h2 style={{ fontFamily: "'Rozha One', serif", color: '#C97F1E', marginTop: 0 }}>Owner Login</h2>
          <form onSubmit={handleLogin}>
            <label>Passcode</label>
            <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} autoFocus />
            {loginError && <p style={{ color: '#C1442E', fontSize: 13, marginTop: 8 }}>{loginError}</p>}
            <button className="btn-primary" type="submit">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  const now = new Date();
  const withStatus = listings.map((l) => {
    const trialEnd = new Date(l.trial_ends_at);
    const daysLeft = Math.ceil((trialEnd - now) / 86400000);
    let status, statusColor;
    if (daysLeft < 0) { status = `Overdue by ${Math.abs(daysLeft)}d`; statusColor = '#C1442E'; }
    else if (daysLeft <= 3) { status = `Due in ${daysLeft}d`; statusColor = '#C97F1E'; }
    else { status = `${daysLeft}d left`; statusColor = '#2E6B4E'; }
    return { ...l, daysLeft, status, statusColor };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  const urgent = withStatus.filter((l) => l.daysLeft <= 3 && l.is_active);
  const upcoming = withStatus.filter((l) => l.daysLeft > 3 && l.is_active);
  const paused = withStatus.filter((l) => !l.is_active);

  function whatsappLink(item) {
    const cityName = item.cities?.name || '';
    const profileUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/city/${encodeURIComponent(cityName)}/${item.id}`
      : '';
    const msg = item.daysLeft < 0
      ? `Hi ${item.name}, your Verilo listing's free period has ended. Pay ₹30 to keep it active: ${profileUrl}`
      : `Hi ${item.name}, your Verilo trial ends in ${item.daysLeft} day(s). Pay ₹30 anytime to keep your listing active after that: ${profileUrl}`;
    return `https://wa.me/91${item.phone}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Owner Dashboard — Payment Due List</p>
        <Link href="/admin/reports" className="back-link">View Reports →</Link>
      </header>

      {loading && <p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p>}

      {!loading && urgent.length > 0 && (
        <>
          <h3 style={{ color: '#E8A33D', fontFamily: "'Rozha One', serif" }}>⚠️ Needs attention ({urgent.length})</h3>
          {urgent.map((item) => (
            <div key={item.id} className="card" style={{ cursor: 'default' }}>
              <div className="card-top">
                <div className="card-left">
                  <div style={{ minWidth: 0 }}>
                    <div className="card-service">{catLabel(item.service)} · {item.cities?.name}</div>
                    <p className="card-name">{item.name}</p>
                    <p className="card-area">📞 {item.phone}</p>
                    <p className="card-rating" style={{ color: item.statusColor }}>{item.status}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <a
                    className="call-btn"
                    style={{ background: '#2E6B4E' }}
                    href={whatsappLink(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                  <button
                    className="call-btn"
                    style={{ background: '#6B7280', border: 'none', cursor: 'pointer' }}
                    onClick={() => adminTogglePause(item)}
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    className="call-btn"
                    style={{ background: '#C97F1E', border: 'none', cursor: 'pointer' }}
                    onClick={() => copyManageLink(item)}
                  >
                    🔗 Get Link
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {!loading && upcoming.length > 0 && (
        <>
          <h3 style={{ color: '#8A94A6', fontFamily: "'Rozha One', serif", marginTop: 24 }}>Upcoming ({upcoming.length})</h3>
          {upcoming.map((item) => (
            <div key={item.id} className="card" style={{ cursor: 'default', opacity: 0.85 }}>
              <div className="card-top">
                <div className="card-left">
                  <div style={{ minWidth: 0 }}>
                    <div className="card-service">{catLabel(item.service)} · {item.cities?.name}</div>
                    <p className="card-name">{item.name}</p>
                    <p className="card-area">📞 {item.phone}</p>
                    <p className="card-rating" style={{ color: item.statusColor }}>{item.status}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <button
                    className="call-btn"
                    style={{ background: '#6B7280', border: 'none', cursor: 'pointer' }}
                    onClick={() => adminTogglePause(item)}
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    className="call-btn"
                    style={{ background: '#C97F1E', border: 'none', cursor: 'pointer' }}
                    onClick={() => copyManageLink(item)}
                  >
                    🔗 Get Link
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {!loading && paused.length > 0 && (
        <>
          <h3 style={{ color: '#6B7280', fontFamily: "'Rozha One', serif", marginTop: 24 }}>⏸️ Paused ({paused.length})</h3>
          {paused.map((item) => (
            <div key={item.id} className="card" style={{ cursor: 'default', opacity: 0.6 }}>
              <div className="card-top">
                <div className="card-left">
                  <div style={{ minWidth: 0 }}>
                    <div className="card-service">{catLabel(item.service)} · {item.cities?.name}</div>
                    <p className="card-name">{item.name}</p>
                    <p className="card-area">📞 {item.phone}</p>
                  </div>
                </div>
                <button
                  className="call-btn"
                  style={{ background: '#2E6B4E', border: 'none', cursor: 'pointer' }}
                  onClick={() => adminTogglePause(item)}
                >
                  ▶️ Unpause
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {!loading && listings.length === 0 && (
        <div className="empty">
          <div className="empty-title">No listings yet</div>
          <div>Once people start adding listings, they'll show up here.</div>
        </div>
      )}
    </div>
  );
}
