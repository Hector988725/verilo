"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";

// "Powered by Hector365" — header (patli patti) aur footer (chhoti pill) dono ke liye.
// Normal flow me hai (fixed nahi), to kisi button/text ko dhakta nahi. Print me chhup jaata hai.
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const NAVY = "#1B2A5C";
const ORANGE = "#F28A1E";

function Mark({ size }) {
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: Math.round(size * 0.32), flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 900, fontSize: Math.round(size * 0.62), lineHeight: 1, fontFamily: FONT,
      background: "linear-gradient(145deg,#FFB347,#F07A12)",
      boxShadow: `0 ${Math.max(1, Math.round(size * 0.08))}px 0 #B4530B, 0 2px 5px rgba(180,83,11,.35), inset 0 1px 0 rgba(255,255,255,.5)`,
      textShadow: "0 1px 1px rgba(120,50,0,.45)",
    }}>H</span>
  );
}


const GUIDE = [
  ["📍", "Choose your city", "Apna shehar chuno (upar city button)"],
  ["🔎", "Pick a category or search", "Category chuno ya naam se dhundo"],
  ["📞", "Tap Call or WhatsApp", "Seedha service provider se baat karo, koi charge nahi"],
  ["🛒", "Order from local shops", "\"Shop now\" se apni dukaan ka saman mangao"],
  ["📝", "Own a business? Register", "\"+ Register\" dabao aur apna kaam city me dikhao"],
];
const MENU = [["/admin/due", "📋 Due List / Reminders"], ["/admin/reports", "🚩 Reported Listings"], ["/admin/ads", "📢 Ads"], ["/admin/cities", "🏙️ City Cleanup"]];

// Ek tap = guide. 5 tez tap ya 1.5 second dabaye rakho = chhupa admin menu (login passcode se hi).
function useHectorTap() {
  const [open, setOpen] = useState(null); // 'guide' | 'admin' | null
  const count = useRef(0), tap = useRef(null), hold = useRef(null), held = useRef(false);
  const onClick = () => {
    if (held.current) { held.current = false; return; }
    count.current += 1;
    clearTimeout(tap.current);
    if (count.current >= 5) { count.current = 0; setOpen("admin"); return; }
    tap.current = setTimeout(() => { count.current = 0; setOpen("guide"); }, 650);
  };
  const start = () => { held.current = false; clearTimeout(hold.current); hold.current = setTimeout(() => { held.current = true; count.current = 0; clearTimeout(tap.current); setOpen("admin"); }, 1500); };
  const stop = () => clearTimeout(hold.current);
  const handlers = { onClick, onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop, onContextMenu: (e) => e.preventDefault(),
    role: "button", tabIndex: 0, "aria-label": "About Hector365 and how to use Verilo", onKeyDown: (e) => { if (e.key === "Enter") setOpen("guide"); } };
  return [open, setOpen, handlers];
}

function Sheets({ open, setOpen }) {
  if (!open) return null;
  const close = () => setOpen(null);
  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, fontFamily: FONT };
  if (open === "admin") {
    return (
      <div onClick={close} style={overlay}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "#1B2430", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: "20px 24px", minWidth: 230, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: "#E8A33D", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>Admin Panel</p>
          {MENU.map(([href, label]) => (
            <Link key={href} href={href} onClick={close} style={{ color: "#fff", background: "#2A3441", padding: "10px 14px", borderRadius: 8, fontSize: 13.5, textDecoration: "none" }}>{label}</Link>
          ))}
          <p onClick={close} style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", marginTop: 6, cursor: "pointer" }}>Close</p>
        </div>
      </div>
    );
  }
  return (
    <div onClick={close} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "20px 20px 16px", width: "100%", maxWidth: 380, maxHeight: "86vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Mark size={30} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>How to use Verilo</div>
            <div style={{ fontSize: 12, color: "#8A7A66" }}>Verilo kaise use karein</div>
          </div>
          <button type="button" onClick={close} aria-label="Close" style={{ border: "none", background: "#F3EEE6", width: 30, height: 30, borderRadius: 15, fontSize: 16, cursor: "pointer", color: "#555" }}>✕</button>
        </div>
        <ol style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {GUIDE.map(([ico, en, hi], i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 30, height: 30, flex: "none", borderRadius: 9, background: "#FCEFD9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{ico}</span>
              <span style={{ lineHeight: 1.3 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1d2433" }}>{i + 1}. {en}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "#6b7280" }}>{hi}</span>
              </span>
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #EFE7DA", fontSize: 12.5, color: "#6b7280", lineHeight: 1.45 }}>
          Verilo is built and run by <b style={{ color: NAVY }}>Hector<span style={{ color: ORANGE }}>365</span></b>, Anuppur (M.P.).
          <div style={{ marginTop: 8, display: "flex", gap: 14 }}>
            <Link href="/contact" onClick={close} style={{ color: "#14342A", fontWeight: 700 }}>Contact Us</Link>
            <Link href="/pricing" onClick={close} style={{ color: "#14342A", fontWeight: 700 }}>Pricing</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PoweredBy({ variant = "footer" }) {
  const css = "@media print{.hc-powered{display:none!important}}";
  const [open, setOpen, h] = useHectorTap();
  if (variant === "header") {
    return (
      <div className="hc-powered" {...h} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 24, boxSizing: "border-box", cursor: "pointer", WebkitTouchCallout: "none", WebkitUserSelect: "none",
        background: "linear-gradient(#FFF9EF,#FCEFD9)", borderBottom: "1px solid rgba(242,138,30,.28)", fontFamily: FONT, userSelect: "none",
      }}>
        <style>{css}</style>
        <Mark size={14} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: "#9A8A76", textTransform: "uppercase" }}>Powered by</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: NAVY, letterSpacing: -0.1, textShadow: "0 1px 0 #fff" }}>Hector<span style={{ color: ORANGE }}>365</span></span>
        <Sheets open={open} setOpen={setOpen} />
      </div>
    );
  }
  return (
    <div className="hc-powered" style={{ display: "flex", justifyContent: "center", padding: "18px 12px 26px", fontFamily: FONT, userSelect: "none" }}>
      <style>{css}</style>
      <div {...h} style={{
        display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 16px 6px 7px", borderRadius: 999, cursor: "pointer", WebkitTouchCallout: "none",
        background: "linear-gradient(#FFFFFF,#FCF1E2)", border: "1px solid rgba(242,138,30,.35)", boxShadow: "0 3px 0 #E6C48F, 0 8px 16px rgba(120,70,10,.16)",
      }}>
        <Mark size={24} />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1.6, color: "#9A8A76", textTransform: "uppercase" }}>Powered by</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: NAVY, letterSpacing: -0.2, textShadow: "0 1px 0 #fff, 0 2px 3px rgba(27,42,92,.22)" }}>Hector<span style={{ color: ORANGE }}>365</span></span>
        </span>
      </div>
      <Sheets open={open} setOpen={setOpen} />
    </div>
  );
}
