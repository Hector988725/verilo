'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// One prompt for three separate installable apps (customer, provider, admin). The browser's
// install event belongs to whichever app's manifest the page was loaded with, so we remember
// which app the event came from and only offer it while the person is still in that app.
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [eventApp, setEventApp] = useState(null);
  const [visible, setVisible] = useState(false);
  const [wantsInstall, setWantsInstall] = useState(false); // opened with ?install=1
  const [noPromptHint, setNoPromptHint] = useState(false);
  const pathname = usePathname() || '';
  const app = pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/provider') ? 'provider' : 'main';
  const appRef = useRef(app);
  appRef.current = app;
  const label = app === 'admin' ? 'Install Verilo Admin' : app === 'provider' ? 'Install Verilo Provider' : 'Install Verilo for quick access';
  const iconSrc = app === 'main' ? '/icons/icon-192.png' : `/icons/${app}-192.png`;

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setEventApp(appRef.current);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWantsInstall(app === 'provider' && new URLSearchParams(window.location.search).get('install') === '1');
  }, [app, pathname]);

  // The "Install app" link on the provider dashboard asks for the popup through this event.
  useEffect(() => {
    function onRequest() {
      if (appRef.current === 'provider') setWantsInstall(true);
    }
    window.addEventListener('verilo:install-request', onRequest);
    return () => window.removeEventListener('verilo:install-request', onRequest);
  }, []);

  // Opened from "install the app" but the browser never offered the install: either the app is
  // already installed or this browser installs from its own menu. Say so instead of staying silent.
  const canPrompt = !!deferredPrompt && eventApp === app;
  const ready = canPrompt; // popup flow: works even after the bottom banner was dismissed
  useEffect(() => {
    if (!wantsInstall || ready) { setNoPromptHint(false); return; }
    const timer = setTimeout(() => setNoPromptHint(true), 2500);
    return () => clearTimeout(timer);
  }, [wantsInstall, ready]);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    setWantsInstall(false);
  }

  function dismiss() {
    setVisible(false);
    setWantsInstall(false);
    setNoPromptHint(false);
  }

  const cardStyle = {
    background: '#FFFFFF', color: '#241F16', padding: '14px 16px', borderRadius: 16,
    display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: '0 10px 28px rgba(90,68,30,0.18)', border: '1px solid rgba(36,31,22,0.10)',
    fontFamily: "'Mukta', sans-serif",
  };
  const iconBox = (
    <span style={{ width: 40, height: 40, borderRadius: 12, flex: '0 0 auto', overflow: 'hidden', border: '1px solid rgba(36,31,22,0.10)' }}>
      <img src={iconSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </span>
  );
  const installBtn = (
    <button
      onClick={install}
      style={{ background: '#E8A33D', color: '#2A1B05', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flex: '0 0 auto' }}
    >
      Install
    </button>
  );

  // Opened via ?install=1 in the provider app: a centered popup with a clear explanation.
  if (wantsInstall && (ready || noPromptHint)) {
    return (
      <div onClick={dismiss} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ ...cardStyle, flexDirection: 'column', alignItems: 'stretch', maxWidth: 380, width: '100%', gap: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {iconBox}
            <strong style={{ fontSize: 16 }}>Get the Verilo Provider app</strong>
          </div>
          {ready ? (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              Open your listing, see your reviews and manage your details in one tap from your home screen.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              If the app is already installed, open it from your home screen or app list. Otherwise use your browser menu and choose
              {' '}<b>Install app</b> or <b>Add to Home screen</b>.
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#6B6259', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '8px 10px' }}>
              {ready ? 'Not now' : 'Got it'}
            </button>
            {ready && installBtn}
          </div>
        </div>
      </div>
    );
  }

  if (!(visible && canPrompt)) return null;

  return (
    <div style={{ ...cardStyle, position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 420, margin: '0 auto', zIndex: 60 }}>
      {iconBox}
      <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
        {label}
      </span>
      {installBtn}
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: '#8A7F6E', cursor: 'pointer', fontSize: 18, padding: 2, flex: '0 0 auto', lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  );
}
