'use client';
import { useEffect, useRef, useState } from 'react';

// Loads the MSG91 OTP Widget once per page and exposes window.sendOtp /
// window.verifyOtp / window.retryOtp (exposeMethods: true keeps MSG91's own
// popup UI hidden so we can keep our existing Send/Enter-OTP/Verify UI).
let widgetLoadPromise = null;
function loadMsg91Widget() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.sendOtp) return Promise.resolve();
  if (widgetLoadPromise) return widgetLoadPromise;

  widgetLoadPromise = fetch('/api/otp/widget-config')
    .then((r) => r.json())
    .then(({ widgetId, tokenAuth, error }) => {
      if (error || !widgetId || !tokenAuth) throw new Error(error || 'Widget config missing');

      return new Promise((resolve) => {
        const configuration = {
          widgetId,
          tokenAuth,
          exposeMethods: true,
          success: () => {},
          failure: () => {},
        };
        const urls = ['https://verify.msg91.com/otp-provider.js', 'https://verify.phone91.com/otp-provider.js'];
        let i = 0;
        function attempt() {
          const s = document.createElement('script');
          s.src = urls[i];
          s.async = true;
          s.onload = () => {
            if (typeof window.initSendOTP === 'function') window.initSendOTP(configuration);
            resolve();
          };
          s.onerror = () => {
            i++;
            if (i < urls.length) attempt();
            else resolve();
          };
          document.head.appendChild(s);
        }
        attempt();
      });
    })
    .catch(() => {
      // Leave window.sendOtp undefined — the UI already handles "OTP
      // service is still loading" / disabled-button states gracefully.
    });
  return widgetLoadPromise;
}

// Renders inline under a phone number field. Calls onVerified() once the
// OTP is confirmed for `phone` — verification happens via MSG91's widget in
// the browser, then the resulting access-token is checked server-side
// before onVerified() fires (so a tampered client can't fake it).
export default function PhoneOtpVerify({ phone, verified, onVerified }) {
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState('idle'); // idle | sent
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reqIdRef = useRef(null);

  useEffect(() => {
    loadMsg91Widget().then(() => setReady(true));
  }, []);

  const validPhone = phone && String(phone).replace(/\D/g, '').length === 10;

  function handleSend() {
    if (!window.sendOtp) { setError('OTP service is still loading, try again in a moment.'); return; }
    setError('');
    setBusy(true);
    window.sendOtp(
      `91${String(phone).replace(/\D/g, '')}`,
      (data) => {
        setBusy(false);
        reqIdRef.current = data?.reqId || data?.message?.reqId || null;
        setStage('sent');
      },
      (err) => {
        setBusy(false);
        setError(err?.message || 'Could not send OTP');
      }
    );
  }

  async function confirmWithServer(accessToken) {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });
    const data = await res.json();
    if (!data.success) { setError(data.error || 'Could not confirm OTP'); return; }
    onVerified();
  }

  function handleVerify() {
    if (!otp.trim()) { setError('Enter the OTP you received'); return; }
    if (!window.verifyOtp) { setError('OTP service is still loading, try again in a moment.'); return; }
    setError('');
    setBusy(true);
    window.verifyOtp(
      otp.trim(),
      (data) => {
        setBusy(false);
        const accessToken = data?.['access-token'] || data?.message || (typeof data === 'string' ? data : null);
        if (!accessToken) { setError('Verification failed — no token received.'); return; }
        confirmWithServer(accessToken);
      },
      (err) => {
        setBusy(false);
        setError(err?.message || 'Invalid OTP');
      },
      reqIdRef.current
    );
  }

  function handleResend() {
    if (!window.retryOtp) return;
    setError('');
    setBusy(true);
    window.retryOtp(
      null,
      () => setBusy(false),
      (err) => { setBusy(false); setError(err?.message || 'Could not resend OTP'); },
      reqIdRef.current
    );
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
          disabled={!validPhone || !ready || busy}
          style={{
            background: validPhone && ready ? 'var(--navy)' : '#ccc', color: '#fff', border: 'none', borderRadius: 8,
            padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: validPhone && ready ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? 'Sending...' : !ready ? 'Loading OTP service...' : 'Verify Phone Number'}
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
        onClick={handleResend}
        disabled={busy}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}
      >
        Resend OTP
      </button>
      {error && <p style={{ color: 'var(--vermillion)', fontSize: 12, width: '100%', margin: 0 }}>{error}</p>}
    </div>
  );
}
