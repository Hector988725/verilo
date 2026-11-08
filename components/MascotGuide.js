"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Mascot saathi: screen par ghoomta hai, jahan dabao wahan aakar chhota sa guide likhta hai.
// Band karne par logo ke paas chhota hokar baith jata hai; usse dabao to wapas chalu.
// Kisi bhi click ko rokta ya badalta nahi (sirf sunta hai).

const NO_RULES = [];
const KEY = "mascot_guide_on";
const W = 64;
const H = 92;
const DOCK_SCALE = 0.74;
const MOVE_MS = 800;
const ACTIVITIES = ["wipe", "sweep", "polish", "wave"];

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
const home = () => ({ x: window.innerWidth - W - 14, y: window.innerHeight - H - 90 });

// Poora chhota mascot: chehra (tumhari image se) + SVG body. Kapde par sirf "hector365".
function Character({ pose, flip }) {
  return (
    <svg className={`mc mc-${pose}${flip ? " mc-flip" : ""}`} viewBox="0 0 64 92" width={W} height={H}
      style={{ display: "block", overflow: "visible", transform: flip ? "scaleX(-1)" : "none" }} aria-hidden="true">
      <ellipse cx="32" cy="89" rx="17" ry="3" fill="rgba(40,30,70,.2)" />
      <g className="mc-bob">
        {/* legs */}
        <g className="mc-l-leg"><rect x="22" y="62" width="8" height="19" rx="3.5" fill="#3A3470" /><rect x="19.5" y="78" width="12.5" height="7" rx="3.5" fill="#25203F" /></g>
        <g className="mc-r-leg"><rect x="34" y="62" width="8" height="19" rx="3.5" fill="#3A3470" /><rect x="32" y="78" width="12.5" height="7" rx="3.5" fill="#25203F" /></g>
        {/* torso + apron */}
        <rect x="17" y="43" width="30" height="26" rx="9" fill="#FBFAFF" />
        <path d="M21 49 h22 v19 a4 4 0 0 1 -4 4 h-14 a4 4 0 0 1 -4 -4z" fill="#5B34B5" />
        <path d="M23 49 L27 43 M41 49 L37 43" stroke="#5B34B5" strokeWidth="2.2" strokeLinecap="round" />
        <text className="mc-tx" x="32" y="62.5" fontSize="5.4" fontWeight="800" fill="#FFFFFF" textAnchor="middle"
          textLength="19" lengthAdjust="spacingAndGlyphs" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>hector365</text>
        {/* neck + head */}
        <rect x="28" y="38" width="8" height="9" rx="3" fill="#F2B98F" />
        <g className="mc-head"><image href="/mascot.png" x="8.5" y="-4" width="47" height="50.5" /></g>
        {/* left arm */}
        <g className="mc-l-arm"><rect x="12.5" y="47.5" width="7.5" height="12" rx="3.7" fill="#FBFAFF" /><rect x="12.5" y="56" width="7.5" height="3.6" rx="1.8" fill="#6B3FD4" /><circle cx="16.3" cy="63" r="3.7" fill="#F2B98F" /></g>
        {/* broom (sweep) */}
        <g className="mc-broom"><rect x="55" y="52" width="2" height="34" rx="1" fill="#A9743D" /><path d="M51 86 h10 l2 5 h-14z" fill="#E0B84A" /></g>
        {/* right arm */}
        <g className="mc-r-arm">
          <rect className="mc-cloth" x="43" y="62" width="10" height="8" rx="2.5" fill="#F6D56A" stroke="#E0B84A" strokeWidth=".6" />
          <rect x="44" y="47.5" width="7.5" height="12" rx="3.7" fill="#FBFAFF" /><rect x="44" y="56" width="7.5" height="3.6" rx="1.8" fill="#6B3FD4" />
          <circle cx="47.8" cy="63" r="3.7" fill="#F2B98F" />
        </g>
      </g>
    </svg>
  );
}

export default function MascotGuide({ name = "Saathi", accent = "#6B3FD4", rules = NO_RULES }) {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(true);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [left, setLeft] = useState(false);
  const [moving, setMoving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [bubble, setBubble] = useState(null);
  const [typed, setTyped] = useState("");
  const [act, setAct] = useState(0);
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

  useEffect(() => {
    let isOn = true;
    try { isOn = localStorage.getItem(KEY) !== "0"; } catch (e) { /* ignore */ }
    setOn(isOn);
    setPos(isOn ? { x: window.innerWidth + 10, y: window.innerHeight - H - 90 } : { x: 8, y: 8 });
    setMounted(true);
    if (!isOn) return;
    let greeted = false;
    try { greeted = sessionStorage.getItem("mascot_greeted") === "1"; } catch (e) { /* ignore */ }
    const t1 = setTimeout(() => moveTo(home().x, home().y), 2600);
    const t2 = setTimeout(() => {
      if (greeted || !onRef.current) return;
      try { sessionStorage.setItem("mascot_greeted", "1"); } catch (e) { /* ignore */ }
      say(`Namaste! Main ${name} hoon. Kahin bhi dabao, main wahan aakar samjha dunga.`, 6500);
    }, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      let text = guideFor(el);
      const lab = labelOf(el).toLowerCase();
      for (const [re, msg] of rules) { if (re.test(lab)) { text = msg; break; } }
      const vw = window.innerWidth, vh = window.innerHeight;
      const px = e.clientX || vw / 2, py = e.clientY || vh / 2;
      const x = px + W + 20 > vw ? clamp(px - W - 12, 4, vw - W - 4) : clamp(px + 10, 4, vw - W - 4);
      const y = py < 140 ? clamp(py + 18, 4, vh - H - 4) : clamp(py - H - 4, 4, vh - H - 4);
      moveTo(x, y);
      setBubble(null);
      setTimeout(() => { if (onRef.current) say(text); }, reduce ? 0 : MOVE_MS - 100);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [moveTo, say, reduce, rules]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!onRef.current || bubbleRef.current || document.visibilityState !== "visible") return;
      const a = document.activeElement;
      if (a && /^(input|textarea|select)$/i.test(a.tagName)) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      moveTo(clamp(Math.random() * (vw - W - 20) + 6, 6, vw - W - 6), vh - H - 90);
    }, 16000);
    return () => clearInterval(id);
  }, [moveTo]);

  // off: logo ke paas khada hokar alag alag kaam karta hai
  useEffect(() => {
    if (on) { setHidden(false); return; }
    function place() {
      const r = findLogo();
      if (r) {
        setHidden(false);
        const x = clamp(r.right - 8, 0, window.innerWidth - W);
        const y = Math.max(2, r.bottom + 4 - H);
        const cur = posRef.current;
        if (Math.abs(cur.x - x) > 1 || Math.abs(cur.y - y) > 1) moveTo(x, y);
      } else if (window.scrollY < 60) {
        setHidden(false);
        setPos({ x: 8, y: 2 });
      } else {
        setHidden(true);
      }
    }
    place();
    const tl = setTimeout(() => setLeft(true), reduce ? 0 : MOVE_MS + 80); // logo ki taraf muh
    const id = setInterval(place, 500);
    const id2 = setInterval(() => setAct((a) => (a + 1) % ACTIVITIES.length), 4500);
    window.addEventListener("resize", place);
    return () => { clearTimeout(tl); clearInterval(id); clearInterval(id2); window.removeEventListener("resize", place); };
  }, [on, moveTo, reduce]);

  function turnOff() {
    setOn(false); persist(false);
    setLeft(true);
    say("Theek hai! Main logo ke paas ja raha hoon. Wahan safai karta rahunga. Mujhe dabaoge to wapas guide karunga.", 4200);
  }

  function turnOn() {
    setOn(true); persist(true);
    setLeft(false);
    const h = home();
    moveTo(h.x, h.y);
    setTimeout(() => say("Main wapas aa gaya! Kahin bhi dabao, main wahan aakar samjha dunga."), reduce ? 0 : MOVE_MS - 100);
  }

  function onMascotClick() {
    if (!on) { turnOn(); return; }
    if (bubble) { setBubble(null); return; }
    say("Kisi bhi button ya link ko dabao, main wahan aakar batata hoon ki wo kya karta hai.");
  }

  if (!mounted) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const bw = Math.min(250, vw - 20);
  const bx = clamp(pos.x + W / 2 - bw / 2, 10, vw - bw - 10) - pos.x;
  const above = pos.y > 150;
  const tail = clamp(W / 2 - bx - 6, 14, bw - 24);
  const activity = ACTIVITIES[act];
  const pose = on ? (moving ? "walk" : bubble ? "talk" : "idle") : (moving ? "walk" : activity);
  const showSparks = !on && (activity === "wipe" || activity === "polish");

  return (
    <div data-mascot="1" aria-live="polite" style={{
      position: "fixed", left: 0, top: 0, zIndex: 9000, pointerEvents: "none",
      transform: `translate(${pos.x}px, ${pos.y}px)`,
      transition: reduce ? "none" : `transform ${MOVE_MS}ms cubic-bezier(.4,.1,.2,1), opacity .3s`,
      opacity: hidden ? 0 : 1, width: W, height: H,
    }}>
      <style>{`
        .mc *{transform-box:view-box}
        .mc-l-leg{transform-origin:26px 62px}.mc-r-leg{transform-origin:38px 62px}
        .mc-l-arm{transform-origin:16px 49px}.mc-r-arm{transform-origin:48px 49px}
        .mc-head{transform-origin:32px 42px}.mc-bob{transform-origin:32px 88px}
        .mc-broom{transform-origin:56px 54px;display:none}.mc-cloth{display:none}
        .mc-flip .mc-tx{transform:scaleX(-1);transform-origin:32px 61px}
        @keyframes mcSwing{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}
        @keyframes mcBob{from{transform:translateY(0)}to{transform:translateY(-2px)}}
        @keyframes mcBreath{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.2px)}}
        @keyframes mcWaveA{from{transform:rotate(-140deg)}to{transform:rotate(-172deg)}}
        @keyframes mcRub{from{transform:rotate(-100deg)}to{transform:rotate(-138deg)}}
        @keyframes mcNod{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
        @keyframes mcSwish{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}
        @keyframes mcTwinkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1.1) rotate(35deg)}}
        .mc-walk .mc-bob{animation:mcBob .19s ease-in-out infinite alternate}
        .mc-walk .mc-l-leg,.mc-walk .mc-r-arm{animation:mcSwing .38s ease-in-out infinite alternate}
        .mc-walk .mc-r-leg,.mc-walk .mc-l-arm{animation:mcSwing .38s ease-in-out infinite alternate-reverse}
        .mc-idle .mc-bob,.mc-talk .mc-bob{animation:mcBreath 2.6s ease-in-out infinite}
        .mc-talk .mc-r-arm{animation:mcWaveA .5s ease-in-out infinite alternate}
        .mc-talk .mc-head,.mc-wave .mc-head{animation:mcNod .45s ease-in-out infinite alternate}
        .mc-wave .mc-bob,.mc-wipe .mc-bob,.mc-polish .mc-bob,.mc-sweep .mc-bob{animation:mcBreath 1.6s ease-in-out infinite}
        .mc-wave .mc-r-arm{animation:mcWaveA .45s ease-in-out infinite alternate}
        .mc-wipe .mc-r-arm{animation:mcRub .32s ease-in-out infinite alternate}
        .mc-wipe .mc-cloth,.mc-polish .mc-cloth{display:block}
        .mc-polish .mc-r-arm{animation:mcWaveA .28s ease-in-out infinite alternate}
        .mc-sweep .mc-broom{display:block;animation:mcSwish .6s ease-in-out infinite alternate}
        .mc-sweep .mc-r-arm{transform:rotate(-30deg)}.mc-sweep .mc-l-arm{transform:rotate(-24deg)}
        .mg-spark{position:absolute;color:#F2B83C;font-size:13px;line-height:1;animation:mcTwinkle 1.2s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.mc *,.mg-spark{animation:none!important}}
      `}</style>
      {bubble && on && (
        <div data-mascot="1" style={{
          position: "absolute", left: bx, width: bw, pointerEvents: "auto",
          ...(above ? { bottom: H + 6 } : { top: H + 6 }),
          background: "#fff", color: "#241F16", border: `2px solid ${accent}`, borderRadius: 16,
          padding: "10px 12px", boxShadow: "0 10px 28px rgba(40,30,70,.22)", fontSize: 13.5, lineHeight: 1.45,
          fontFamily: "inherit",
        }}>
          <span style={{
            position: "absolute", left: tail, width: 12, height: 12, background: "#fff", transform: "rotate(45deg)",
            ...(above ? { bottom: -8, borderRight: `2px solid ${accent}`, borderBottom: `2px solid ${accent}` }
              : { top: -8, borderLeft: `2px solid ${accent}`, borderTop: `2px solid ${accent}` }),
          }} />
          <div style={{ fontWeight: 700, color: accent, fontSize: 12, marginBottom: 3 }}>{name}</div>
          <div style={{ position: "relative" }}>
            <span style={{ visibility: "hidden" }}>{bubble.text}</span>
            <span style={{ position: "absolute", left: 0, top: 0 }}>{typed}</span>
          </div>
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
      {showSparks && (
        <>
          <span className="mg-spark" style={{ left: -16, top: 34 }}>✦</span>
          <span className="mg-spark" style={{ left: -32, top: 50, animationDelay: ".4s", fontSize: 10 }}>✦</span>
          <span className="mg-spark" style={{ left: -8, top: 56, animationDelay: ".8s", fontSize: 9 }}>✦</span>
        </>
      )}
      <div style={{ transform: on ? "none" : `scale(${DOCK_SCALE})`, transformOrigin: "50% 100%", transition: reduce ? "none" : "transform .5s", filter: "drop-shadow(0 4px 6px rgba(40,30,70,.22))" }}>
        <Character pose={pose} flip={left} />
      </div>
      <button data-mascot="1" onClick={onMascotClick} aria-label={on ? `${name} guide` : `${name} guide chalu karo`}
        style={{
          position: "absolute", left: 8, top: 10, width: 48, height: 78, padding: 0, border: "none", background: "transparent",
          cursor: "pointer", pointerEvents: "auto", WebkitTapHighlightColor: "transparent",
        }} />
    </div>
  );
}
