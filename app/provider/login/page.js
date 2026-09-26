'use client';
import { Suspense, useEffect, useState } from 'react';
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
  const { user, signUp, signIn, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/provider/dashboard';

  // If Supabase already established a session on this page load — e.g. the
  // user just clicked their email confirmation link, which lands back here
  // with ?next= preserved — skip straight to where they were heading
  // instead of making them sign in again.
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next]);

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

    if (mode === 'forgot') {
      if (!email.trim()) { setErr('Please enter your email.'); return; }
      setBusy(true);
      try {
        const { error } = await resetPassword(email.trim());
        if (error) setErr(error.message);
        else setInfo('If an account exists for that email, a reset link has been sent. Check your inbox.');
      } catch (err2) {
        setErr(err2?.message || 'Something went wrong. Please try again.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!email.trim() || !password) { setErr('Please fill in email and password.'); return; }
    if (mode === 'signup' && !name.trim()) { setErr('Please enter your name.'); return; }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await signUp(name.trim(), email.trim(), password);
        if (error) setErr(error.message);
        else setInfo('✅ Account created! Check your email inbox (and Spam/Promotions folder) for a confirmation link. Once confirmed, come back here and Sign In.');
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) { setErr(error.message); return; }
        router.push(next);
        return;
      }
    } catch (err2) {
      setErr(err2?.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
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
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <button type="button" className={'tab' + (mode === 'signin' ? ' active' : '')} onClick={() => { setMode('signin'); setErr(''); setInfo(''); }} style={{ flex: 1, textAlign: 'center' }}>Sign In</button>
            <button type="button" className={'tab' + (mode === 'signup' ? ' active' : '')} onClick={() => { setMode('signup'); setErr(''); setInfo(''); }} style={{ flex: 1, textAlign: 'center' }}>Register as Provider</button>
          </div>
        )}
        {mode === 'forgot' && (
          <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 4 }}>
            Enter the email on your provider account — we'll send you a link to reset your password.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label>Your Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
            </>
          )}
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {mode !== 'forgot' && (
            <>
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
            </>
          )}
          {mode === 'signin' && (
            <p style={{ textAlign: 'right', marginTop: 6 }}>
              <span onClick={() => { setMode('forgot'); setErr(''); setInfo(''); }} style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                Forgot password?
              </span>
            </p>
          )}
          {err && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{err}</p>}
          {info && (
            <div style={{ background: 'rgba(31,111,82,0.1)', border: '1.5px solid #1F6F52', borderRadius: 10, padding: '10px 12px', marginTop: 10 }}>
              <p style={{ color: '#1F6F52', fontSize: 13, fontWeight: 600, margin: 0 }}>{info}</p>
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'forgot' ? 'Send Reset Link' : mode === 'signup' ? 'Create Provider Account' : 'Sign In'}
          </button>
          {mode === 'forgot' && (
            <p style={{ textAlign: 'center', marginTop: 10 }}>
              <span onClick={() => { setMode('signin'); setErr(''); setInfo(''); }} style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                ← Back to Sign In
              </span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
