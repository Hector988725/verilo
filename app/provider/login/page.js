'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';

export default function ProviderLoginPage() {
  return (
    <Suspense fallback={<div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>}>
      <ProviderLoginContent />
    </Suspense>
  );
}

function ProviderLoginContent() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/provider/dashboard';

  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

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
      if (error) { setErr(error.message); setBusy(false); return; }
      router.push(next);
      return;
    }
    setBusy(false);
  }

  return (
    <div className="city-screen">
      <div className="pin"></div>
      <h1>Verilo</h1>
      <p className="tagline">Service Provider Login</p>
      <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 320, marginTop: -8 }}>
        List your business, manage it anytime, and pay to stay visible — all from one account.
      </p>

      <div className="form-card" style={{ width: '100%', maxWidth: 360, marginTop: 20, textAlign: 'left' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <button type="button" className={'tab' + (mode === 'signin' ? ' active' : '')} onClick={() => { setMode('signin'); setErr(''); setInfo(''); }} style={{ flex: 1, textAlign: 'center' }}>Sign In</button>
          <button type="button" className={'tab' + (mode === 'signup' ? ' active' : '')} onClick={() => { setMode('signup'); setErr(''); setInfo(''); }} style={{ flex: 1, textAlign: 'center' }}>Register as Provider</button>
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
            <button type="button" onClick={() => setShowPass((s) => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', padding: 4 }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {err && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{err}</p>}
          {info && <p style={{ color: '#2E6B4E', fontSize: 13, marginTop: 8 }}>{info}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'signup' ? 'Create Provider Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
