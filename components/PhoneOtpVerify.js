'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Logged-in user ka access token — server OTP routes ko login chahiye.
async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// Renders inline under a phone number field. Calls onVerified() once the
// entered OTP is confirmed for `phone`; onVerified(proof) ko server ka signed proof milta hai. If `phone` changes after
// verification, the parent should treat verified as stale (pass a fresh
// key or reset), since this component doesn't watch for that itself.
export default function PhoneOtpVerify({ phone, verified, onVerified }) {
  const [stage, setStage] = useState('idle'); // idle | sent | verifying
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const validPhone = phone && String(phone).replace(/\D/g, '').length === 10;

  async function handleSend() {
    setError('');
    setBusy(true);
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.success) { setError(data.error || 'Could not send OTP'); return; }
    setStage('sent');
  }

  async function handleVerify() {
    if (!otp.trim()) { setError('Enter the OTP you received'); return; }
    setError('');
    setBusy(true);
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ phone, otp: otp.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.success) { setError(data.error || 'Invalid OTP'); return; }
    onVerified(data.proof);
  }

  if (verified) {
    return <p style={{ color: '#1F6F52', fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>✓ Phone number verified</p>;
  }

  if (stage === 'idle') {
    return (
      <div style={{ marginTop: 6 }}>
        <button
          type="button"
          onClick={handleSend}
          disabled={!validPhone || busy}
          style={{
            background: validPhone ? 'var(--navy)' : '#ccc', color: '#fff', border: 'none', borderRadius: 8,
            padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: validPhone ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? 'Sending...' : 'Verify Phone Number'}
        </button>
        {error && <p style={{ color: 'var(--vermillion)', fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit OTP"
        maxLength={6}
        style={{ maxWidth: 150 }}
      />
      <button
        type="button"
        onClick={handleVerify}
        disabled={busy}
        style={{ background: 'var(--brand-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
      >
        {busy ? 'Verifying...' : 'Verify'}
      </button>
      <button
        type="button"
        onClick={handleSend}
        disabled={busy}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}
      >
        Resend OTP
      </button>
      {error && <p style={{ color: 'var(--vermillion)', fontSize: 12, width: '100%', margin: 0 }}>{error}</p>}
    </div>
  );
}
