'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
function keyBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
async function token() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || '';
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || '');
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

// Provider dashboard: "Turn on alerts" (naya review / Call / WhatsApp tap).
export default function ProviderPushToggle() {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      let s = 'off';
      if (!VAPID) s = 'unavailable';
      else if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) s = isIOS() && !standalone() ? 'needs-install' : 'unsupported';
      else if (Notification.permission === 'denied') s = 'denied';
      else {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = reg && (await reg.pushManager.getSubscription());
          if (sub && Notification.permission === 'granted') s = 'on';
        } catch (e) {}
      }
      if (alive) setSt(s);
    })();
    return () => { alive = false; };
  }, []);

  if (st === null || st === 'unavailable' || st === 'unsupported') return null;
  const box = { fontSize: 12.5, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 };
  if (st === 'needs-install') return <p style={box}>🔔 To get alerts on iPhone: tap Share → <b>Add to Home Screen</b>, then open Verilo from its icon.</p>;
  if (st === 'denied') return <p style={box}>🔕 Alerts are blocked. Allow notifications for this site in your browser settings.</p>;

  async function turnOn() {
    setBusy(true); setMsg('');
    try {
      const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (perm !== 'granted') { setSt(perm === 'denied' ? 'denied' : 'off'); setBusy(false); return; }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (await token()) },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error('save');
      setSt('on');
    } catch (e) { setMsg('Could not turn on alerts. Please try again.'); }
    setBusy(false);
  }
  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) {
        await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (await token()) }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe();
      }
    } catch (e) {}
    setSt('off'); setBusy(false);
  }

  if (st === 'on') {
    return <p style={{ ...box, color: 'var(--verified, #1B7F3B)', fontWeight: 700 }}>🔔 Alerts on — you'll hear about new reviews and calls. <button onClick={turnOff} disabled={busy} style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>turn off</button></p>;
  }
  return (
    <div style={{ margin: '8px 0 0' }}>
      <button onClick={turnOn} disabled={busy} style={{ background: 'var(--paper)', border: '1.5px solid var(--brand-green)', color: 'var(--brand-green)', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        {busy ? 'Please wait…' : '🔔 Turn on alerts for reviews & calls'}
      </button>
      {msg && <p style={{ color: 'var(--vermillion)', fontSize: 12.5, marginTop: 6 }}>{msg}</p>}
    </div>
  );
}
