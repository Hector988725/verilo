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
        position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
        background: '#232F3E', color: '#FFFDF6', padding: '10px 16px', borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 10, zIndex: 60,
        boxShadow: '0 8px 20px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.09)',
        fontFamily: "'Mukta', sans-serif", fontSize: 13.5,
      }}
    >
      <span>Install Verilo for quick access</span>
      <button
        onClick={install}
        style={{
          background: '#E8A33D', color: '#241703', border: 'none', borderRadius: 999,
          padding: '6px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}
      >
        Install
      </button>
      <button
        onClick={() => setVisible(false)}
        style={{ background: 'none', border: 'none', color: '#8A94A6', cursor: 'pointer', fontSize: 16, padding: 0 }}
      >
        ✕
      </button>
    </div>
  );
}
