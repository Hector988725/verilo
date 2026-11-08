"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Mascot saathi: screen par ghoomta hai, jahan dabao wahan aakar chhota sa guide likhta hai.
// Band karne par logo ke paas chhota hokar baith jata hai; usse dabao to wapas chalu.
// Kisi bhi click ko rokta ya badalta nahi (sirf sunta hai).

const NO_RULES = [];
const KEY = "mascot_guide_on";
const SIZE = 64;
const DOCK = 30;
const MOVE_MS = 700;

const RULES = [
  [/log ?in|sign ?in/, "Apna email aur password daalo. Password yaad na ho to 'Forgot password' dabao."],
  [/log ?out|sign ?out/, "Isse aap is device par logout ho jaoge."],
  [/sign ?up|register|create|banao|naya|\bnew\b/, "Naya account banane ke liye jaankari bharo. Email sahi daalna, usi par link aayega."],
  [/add (your )?(listing|business|service)|list your|apna (kaam|business)|register your/, "Yaha apna kaam ya dukaan Verilo par daalo, taaki aapke shehar ke log aapko dhoondh sakein."],
  [/pay|upi|razorpay|autopay|renew|upgrade|subscribe|\bplan\b|₹/, "Payment Razorpay ke surakshit page par hoti hai. Kisi ko apna PIN ya OTP mat batana."],
  [/delete|remove|hatao|hata do|cancel/, "Dhyan se! Ye hatane ke baad wapas nahi aayega."],
  [/save|update|submit|confirm|\bdone\b|bhej/, "Ye aapki bhari hui jaankari save kar dega."],
  [/search|find|khoj|dhoond/, "Yaha kaam ya naam likho, aapke shehar ke matching log dikh jayenge."],
  [/back|close|wapas|✕|×/, "Ye pichhli screen par wapas le jayega."],
  [/install/, "Ye app ko aapke phone ki home screen par laga dega, bilkul normal app ki tarah."],
  [/whatsapp/, "Ye seedha WhatsApp kholega, wahi se baat kar sakte ho."],
  [/\bcall\b|phone|dial/, "Ye seedha phone dialer kholega."],
  [/rating|review|star|rate/, "Yaha apna anubhav batao, isse dusre logon ko sahi chunne me madad milti hai."],
  [/city|state|district|shehar|zila/, "Yaha apna shehar ya zila chuno, usi ke hisaab se list dikhegi."],
  [/provider|dashboard/, "Yaha aap apni listing aur reviews sambhal sakte ho."],
  [/pricing|price|rate card/, "Yaha plan aur unke daam dekho."],
  [/^(en|हि|हिं|hi)$|language|hindi|english|bhasha|\blang\b/, "Yaha se bhasha badal sakte ho."],
];

function labelOf(el) {
  const raw = el.getAttribute("data-guide-label") || el.getAttribute("aria-label") || el.getAttribute("title") ||
    el.getAttribute("placeholder") || el.getAttribute("alt") || (el.innerText || "") || "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 30);
}

function guideFor(el) {
  const custom = el.getAttribute("data-guide");
  if (custom) return custom;
  const tag = el.tagName.toLowerCase();
  const type = (el.getAttribute("type") || "").toLowerCase();
  const label = labelOf(el);
  if (type === "password") return "Password kam se kam 8 akshar ka rakho aur kisi ko mat batana.";
  const low = label.toLowerCase();
  for (const [re, text] of RULES) if (re.test(low)) return text;
  if (tag === "select") return "List me se ek option chuno.";
  if (type === "checkbox" || type === "radio") return "Ye option chunne ya hatane ke liye dabao.";
  if (tag === "input" || tag === "textarea") return label ? `Yaha ${label} likho.` : "Yaha jaankari likho.";
  if (tag === "a") return label ? `"${label}" khulega.` : "Ye link naya page kholega.";
  return label ? `"${label}" dabane par aage ka step khulega.` : "Ye dabane par aage ka step khulega.";
}

function findLogo() {
  const sels = ["[data-mascot-logo]", "header img", 'img[alt*="logo" i]', "header a", 'a[href="/"]', "header h1", "h1"];
  for (const s of sels) {
    for (const el of document.querySelectorAll(s)) {
      const r = el.getBoundingClientRect();
      if (r.width > 8 && r.height > 8 && r.top >= -5 && r.top < 180 && r.left < window.innerWidth * 0.7) return r;
    }
  }
  return null;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const home = () => ({ x: window.innerWidth - SIZE - 14, y: window.innerHeight - SIZE - 96 });

export default function MascotGuide({ name = "Saathi", accent = "#6B3FD4", rules = NO_RULES }) {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(true);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [left, setLeft] = useState(false);
  const [moving, setMoving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [bubble, setBubble] = useState(null); // { text }
  const [typed, setTyped] = useState("");
  const posRef = useRef(pos);
  const onRef = useRef(on);
  const bubbleRef = useRef(null);
  const moveTimer = useRef(null);
  const hideTimer = useRef(null);
  const lastClick = useRef(0);
  posRef.current = pos;
  onRef.current = on;
  bubbleRef.current = bubble;
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const moveTo = useCallback((x, y) => {
    const cur = posRef.current;
    if (x !== cur.x) setLeft(x < cur.x);
    setPos({ x, y });
    setMoving(true);
    clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => setMoving(false), reduce ? 0 : MOVE_MS);
  }, [reduce]);

  const say = useCallback((text, ms) => {
    setBubble({ text });
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setBubble(null), ms || Math.max(5200, text.length * 75));
  }, []);

  function persist(v) { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) { /* ignore */ } }

  // start
  useEffect(() => {
    let isOn = true;
    try { isOn = localStorage.getItem(KEY) !== "0"; } catch (e) { /* ignore */ }
    setOn(isOn);
    setPos(isOn ? { x: window.innerWidth + 10, y: window.innerHeight - SIZE - 96 } : { x: 8, y: 8 });
    setMounted(true);
    if (!isOn) return;
    let greeted = false;
    try { greeted = sessionStorage.getItem("mascot_greeted") === "1"; } catch (e) { /* ignore */ }
    const t1 = setTimeout(() => moveTo(home().x, home().y), 3000);
    const t2 = setTimeout(() => {
      if (greeted || !onRef.current) return;
      try { sessionStorage.setItem("mascot_greeted", "1"); } catch (e) { /* ignore */ }
      say(`Namaste! Main ${name} hoon. Kahin bhi dabao, main samjha dunga.`, 6500);
    }, 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // typewriter
  useEffect(() => {
    if (!bubble) { setTyped(""); return; }
    let i = 0;
    setTyped("");
    const id = setInterval(() => {
      i += 1;
      setTyped(bubble.text.slice(0, i));
      if (i >= bubble.text.length) clearInterval(id);
    }, reduce ? 0 : 22);
    return () => clearInterval(id);
  }, [bubble, reduce]);

  // click guide
  useEffect(() => {
    function onClick(e) {
      if (!onRef.current) return;
      const t = e.target;
      if (!(t instanceof Element) || t.closest("[data-mascot]")) return;
      const el = t.closest("button,a,input,select,textarea,label,summary,[role=button],[data-guide]");
      if (!el) return;
      const now = Date.now();
      if (now - lastClick.current < 350) return;
      lastClick.current = now;
      const text = guideFor(el);
      let custom = null;
      for (const [re, msg] of rules) { if (re.test(labelOf(el).toLowerCase())) { custom = msg; break; } }
      const vw = window.innerWidth, vh = window.innerHeight;
      const px = e.clientX || vw / 2, py = e.clientY || vh / 2;
      const x = clamp(px + 16, 6, vw - SIZE - 6);
      const y = py < 150 ? clamp(py + 24, 6, vh - SIZE - 6) : clamp(py - SIZE - 14, 6, vh - SIZE - 6);
      moveTo(x, y);
      setBubble(null);
      setTimeout(() => { if (onRef.current) say(custom || text); }, reduce ? 0 : MOVE_MS - 150);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [moveTo, say, reduce, rules]);

  // idle stroll along the bottom
  useEffect(() => {
    const id = setInterval(() => {
      if (!onRef.current || bubbleRef.current || document.visibilityState !== "visible") return;
      const a = document.activeElement;
      if (a && /^(input|textarea|select)$/i.test(a.tagName)) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      moveTo(clamp(Math.random() * (vw - SIZE - 20) + 6, 6, vw - SIZE - 6), vh - SIZE - 96);
    }, 15000);
    return () => clearInterval(id);
  }, [moveTo]);

  // dock beside the logo while off
  useEffect(() => {
    if (on) { setHidden(false); return; }
    function place() {
      const r = findLogo();
      if (r) {
        setHidden(false);
        const x = clamp(r.right + 6, 4, window.innerWidth - DOCK - 4);
        const y = clamp(r.top + (r.height - DOCK) / 2, 2, window.innerHeight - DOCK - 2);
        const cur = posRef.current;
        if (Math.abs(cur.x - x) > 1 || Math.abs(cur.y - y) > 1) { setPos({ x, y }); }
      } else if (window.scrollY < 60) {
        setHidden(false);
        setPos({ x: 8, y: 8 });
      } else {
        setHidden(true);
      }
    }
    place();
    const id = setInterval(place, 500);
    window.addEventListener("resize", place);
    return () => { clearInterval(id); window.removeEventListener("resize", place); };
  }, [on]);

  function turnOff() {
    setOn(false); persist(false);
    clearTimeout(hideTimer.current);
    say("Theek hai! Main logo ke paas baith raha hoon. Mujhe dabaoge to wapas guide karunga.", 3500);
    const r = findLogo();
    const vw = window.innerWidth;
    moveTo(r ? clamp(r.right + 6, 4, vw - DOCK - 4) : 8, r ? clamp(r.top + (r.height - DOCK) / 2, 2, 9999) : 8);
  }

  function turnOn() {
    setOn(true); persist(true);
    const h = home();
    moveTo(h.x, h.y);
    setTimeout(() => say("Main wapas aa gaya! Kahin bhi dabao, main samjha dunga."), reduce ? 0 : MOVE_MS - 150);
  }

  function onMascotClick() {
    if (!on) { turnOn(); return; }
    if (bubble) { setBubble(null); return; }
    say("Kisi bhi button ya link ko dabao, main batata hoon ki wo kya karta hai.");
  }

  if (!mounted) return null;

  const size = on ? SIZE : DOCK;
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const bw = Math.min(250, vw - 20);
  const bx = clamp(pos.x + size / 2 - bw / 2, 10, vw - bw - 10) - pos.x;
  const above = pos.y > 150;

  return (
    <div data-mascot="1" aria-live="polite" style={{
      position: "fixed", left: 0, top: 0, zIndex: 9000, pointerEvents: "none",
      transform: `translate(${pos.x}px, ${pos.y}px)`,
      transition: reduce ? "none" : `transform ${on ? MOVE_MS : 600}ms cubic-bezier(.4,.1,.2,1), opacity .3s`,
      opacity: hidden ? 0 : 1, width: size, height: size,
    }}>
      <style>{`
        @keyframes mgBreath{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.03)}}
        @keyframes mgStep{from{transform:translateY(0) rotate(-6deg)}to{transform:translateY(-8px) rotate(6deg)}}
        @keyframes mgSit{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.96)}}
        .mg-img{width:100%;height:100%;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none;transform-origin:50% 90%}
        .mg-idle .mg-img{animation:mgBreath 2.6s ease-in-out infinite}
        .mg-walk .mg-img{animation:mgStep .32s ease-in-out infinite alternate}
        .mg-sit .mg-img{animation:mgSit 3s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.mg-img{animation:none!important}}
      `}</style>
      {bubble && on && (
        <div data-mascot="1" style={{
          position: "absolute", left: bx, width: bw, pointerEvents: "auto",
          ...(above ? { bottom: size + 10 } : { top: size + 10 }),
          background: "#fff", color: "#241F16", border: `2px solid ${accent}`, borderRadius: 16,
          padding: "10px 12px", boxShadow: "0 10px 28px rgba(40,30,70,.22)", fontSize: 13.5, lineHeight: 1.45,
          fontFamily: "inherit",
        }}>
          <div style={{ fontWeight: 700, color: accent, fontSize: 12, marginBottom: 3 }}>{name}</div>
          <div style={{ position: "relative" }}><span style={{ visibility: "hidden" }}>{bubble.text}</span><span style={{ position: "absolute", left: 0, top: 0 }}>{typed}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
            <button data-mascot="1" onClick={() => setBubble(null)}
              style={{ background: accent, color: "#fff", border: "none", borderRadius: 999, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Samajh gaya
            </button>
            <button data-mascot="1" onClick={turnOff}
              style={{ background: "none", border: "none", color: "#6B6259", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: "5px 4px" }}>
              Guide band karo
            </button>
          </div>
        </div>
      )}
      <button data-mascot="1" onClick={onMascotClick} aria-label={on ? `${name} guide` : `${name} guide chalu karo`}
        className={on ? (moving ? "mg-walk" : "mg-idle") : "mg-sit"}
        style={{
          pointerEvents: "auto", width: size, height: size, padding: 0, border: "none", background: "none", cursor: "pointer",
          transform: left ? "scaleX(-1)" : "none", transition: reduce ? "none" : "width .5s, height .5s",
          filter: "drop-shadow(0 6px 8px rgba(40,30,70,.28))", WebkitTapHighlightColor: "transparent",
        }}>
        <img className="mg-img" src="/mascot.png" alt="" draggable="false" />
      </button>
    </div>
  );
}
