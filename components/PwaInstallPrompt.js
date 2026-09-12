'use client';
import { useEffect, useState } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 420, margin: '0 auto',
        background: '#FFFFFF', color: '#241F16', padding: '14px 16px', borderRadius: 16,
        display: 'flex', alignItems: 'center', gap: 12, zIndex: 60,
        boxShadow: '0 10px 28px rgba(90,68,30,0.18)', border: '1px solid rgba(36,31,22,0.10)',
        fontFamily: "'Mukta', sans-serif",
      }}
    >
      <span style={{
        width: 40, height: 40, borderRadius: 12, flex: '0 0 auto', overflow: 'hidden',
        border: '1px solid rgba(36,31,22,0.10)',
      }}>
        <img src="/icons/icon-192.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
        Install Verilo for quick access
      </span>
      <button
        onClick={install}
        style={{
          background: '#E8A33D', color: '#2A1B05', border: 'none', borderRadius: 999,
          padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flex: '0 0 auto',
        }}
      >
        Install
      </button>
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
