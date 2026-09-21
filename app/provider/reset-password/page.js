'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!password || password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setErr('Passwords do not match.'); return; }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/provider/dashboard'), 1500);
  }

  return (
    <div className="city-screen">
      <div className="pin"></div>
      <h1>Verilo</h1>
      <p className="tagline">Set a New Password</p>

      <div className="form-card" style={{ width: '100%', maxWidth: 360, marginTop: 20, textAlign: 'left' }}>
        {done ? (
          <p style={{ color: '#1F6F52', fontSize: 14, textAlign: 'center' }}>
            ✅ Password updated! Taking you to your dashboard...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>New Password</label>
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
            <label>Confirm Password</label>
            <input type={showPass ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" />
            {err && <p style={{ color: 'var(--vermillion)', fontSize: 13, marginTop: 8 }}>{err}</p>}
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? 'Please wait...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
