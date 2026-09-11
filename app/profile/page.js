'use client';
import { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setInfo('');
    if (!email.trim() || !password) { setErr('Please fill in email and password.'); return; }
    if (mode === 'signup' && !name.trim()) { setErr('Please enter your name.'); return; }

    setBusy(true);
    if (mode === 'signup') {
      const { error } = await signUp(name.trim(), email.trim(), password);
      if (error) setErr(error.message);
      else setInfo('Account created! Check your email to confirm, then sign in.');
    } else {
      const { error } = await signIn(email.trim(), password);
      if (error) setErr(error.message);
    }
    setBusy(false);
  }

  if (!user) {
    return (
      <div className="city-screen">
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Sign in to save listings and track your enquiries</p>

        <div className="form-card" style={{ width: '100%', maxWidth: 360, marginTop: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <button
              type="button"
              className={'tab' + (mode === 'signin' ? ' active' : '')}
              onClick={() => { setMode('signin'); setErr(''); setInfo(''); }}
              style={{ flex: 1, textAlign: 'center' }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={'tab' + (mode === 'signup' ? ' active' : '')}
              onClick={() => { setMode('signup'); setErr(''); setInfo(''); }}
              style={{ flex: 1, textAlign: 'center' }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <label>Your Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
              </>
            )}
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', padding: 4,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {err && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{err}</p>}
            {info && <p style={{ color: '#2E6B4E', fontSize: 13, marginTop: 8 }}>{info}</p>}
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email;

  return (
    <div className="wrap">
      <div className="profile-header">
        <div className="profile-avatar">{(displayName || '?')[0].toUpperCase()}</div>
        <h2 className="profile-name">{displayName}</h2>
        <p className="profile-meta">{user.email}</p>
      </div>

      <div className="profile-card">
        <Link href="/saved" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', textDecoration: 'none', color: 'var(--ink)', fontWeight: 600 }}>
          ❤️ Saved Listings <span style={{ color: 'var(--muted)' }}>→</span>
        </Link>
      </div>
      <div className="profile-card">
        <Link href="/bookings" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', textDecoration: 'none', color: 'var(--ink)', fontWeight: 600 }}>
          📋 My Bookings / Enquiries <span style={{ color: 'var(--muted)' }}>→</span>
        </Link>
      </div>

      <button className="btn-primary" style={{ background: 'var(--ink)', boxShadow: 'none' }} onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
}
