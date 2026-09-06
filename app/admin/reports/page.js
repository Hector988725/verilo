'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { catLabel } from '../../../lib/categories';

export default function ReportsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reports, setReports] = useState([]);
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
    loadReports();
  }, [unlocked]);

  async function loadReports() {
    setLoading(true);
    const res = await fetch('/api/admin/reports');
    if (res.status === 401) {
      localStorage.removeItem('verilo_admin_ok');
      setUnlocked(false);
      setLoading(false);
      return;
    }
    const result = await res.json();
    setReports(result.reports || []);
    setLoading(false);
  }

  async function dismissReport(reportId) {
    await fetch('/api/admin/dismiss-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: reportId }),
    });
    loadReports();
  }

  async function pauseListing(listingId) {
    await fetch('/api/admin/toggle-pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, is_active: false }),
    });
    alert('Listing paused.');
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

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Owner Dashboard — Reported Listings</p>
        <Link href="/admin/due" className="back-link">Go to Due List →</Link>
      </header>

      {loading && <p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p>}

      {!loading && reports.length === 0 && (
        <div className="empty">
          <div className="empty-title">No reports</div>
          <div>Nothing has been reported. This page will fill up if a customer flags a listing.</div>
        </div>
      )}

      {!loading && reports.map((r) => (
        <div key={r.id} className="card" style={{ cursor: 'default' }}>
          <div className="card-top">
            <div className="card-left">
              <div style={{ minWidth: 0 }}>
                {r.listings ? (
                  <>
                    <div className="card-service">{catLabel(r.listings.service)} · {r.listings.cities?.name}</div>
                    <p className="card-name">{r.listings.name}</p>
                    <p className="card-area">📞 {r.listings.phone}</p>
                  </>
                ) : (
                  <p className="card-name" style={{ color: '#8A94A6' }}>Listing was already deleted</p>
                )}
                <p style={{ fontSize: 13.5, color: '#C1442E', marginTop: 6, fontStyle: 'italic' }}>
                  "{r.reason}"
                </p>
                <p style={{ fontSize: 11.5, color: '#8A94A6', marginTop: 2 }}>
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              {r.listings && (
                <button
                  className="call-btn"
                  style={{ background: '#6B7280', border: 'none', cursor: 'pointer' }}
                  onClick={() => pauseListing(r.listings.id)}
                >
                  ⏸️ Pause listing
                </button>
              )}
              <button
                className="call-btn"
                style={{ background: '#2E6B4E', border: 'none', cursor: 'pointer' }}
                onClick={() => dismissReport(r.id)}
              >
                ✓ Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
