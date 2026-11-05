import Link from 'next/link';
import { CATEGORIES } from '../../lib/categories';

export const metadata = {
  title: 'Apna Kaam Online Dikhayein | Verilo',
  description: 'Plumber, electrician, tutor, tailor, DJ, photographer — Verilo par apni listing banayein. Customer seedha aapko call kare. Sirf ₹30/mahina.',
};

const BROWN = '#8C6224', RED = '#9C2E20', INK = '#141F29', MUTED = '#6B7280', LINE = '#E7E0CC';

function cleanCity(c) {
  const s = String(c || '').replace(/[^\p{L} ]/gu, '').trim().slice(0, 30);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

const BENEFITS = [
  ['📞', 'Customer seedha call kare', 'Beech mein koi dalal nahi. Customer aapka number dekhkar seedha call ya WhatsApp karta hai.'],
  ['⭐', 'Rating aur reviews', 'Achha kaam karenge to reviews badhenge aur naye customer bharosa karenge.'],
  ['📍', 'Apne sheher mein dikhein', 'Jab koi aapke sheher mein aapki service dhoondhe, aapki listing wahan dikhti hai.'],
  ['💸', 'Koi commission nahi', 'Customer se jo bhi paisa milta hai wo poora aapka. Verilo sirf listing fee leta hai.'],
  ['📱', 'Phone se sab kuch', 'Listing, photos aur details aap mobile se khud badal sakte hain.'],
  ['🔔', 'Renewal ka reminder', 'Listing khatam hone se pehle aapko yaad dilaya jaata hai, taaki aap kabhi gayab na ho.'],
];

const STEPS = [
  ['1', 'Account banayein', 'Email se provider account. 2 minute ka kaam.'],
  ['2', 'Listing daalein', 'Naam, kaam, area, phone number aur photo jodein.'],
  ['3', '₹30 pay karke live ho jayein', 'UPI se payment karte hi aapki listing sabko dikhne lagti hai.'],
];

const PLANS = [
  ['1 Mahina', '₹30', ''],
  ['6 Mahine', '₹150', '1 mahina free'],
  ['12 Mahine', '₹300', '2 mahine free'],
];

const FAQ = [
  ['Customer ko kuch dena padta hai?', 'Nahi. Customer ke liye Verilo dekhna aur call karna hamesha free hai.'],
  ['Kya Verilo mere kaam ka paisa kaat-ta hai?', 'Nahi. Customer aur aapke beech jo bhi paisa hota hai, Verilo ka usse koi lena-dena nahi. Aap sirf listing fee dete hain.'],
  ['Kaun si services jud sakti hain?', 'Plumber, electrician, mistri, mechanic, AC repair, beauty parlour, tailor, tuition, DJ, photographer aur bahut si. Alag kaam ho to "Other" chunein.'],
  ['Kitna kharcha hai?', '₹30/mahina. 6 mahine ya 12 mahine lene par sasta padta hai.'],
];

export default async function GrowPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const city = cleanCity(Array.isArray(sp.c) ? sp.c[0] : sp.c);
  const start = city ? `/city/${encodeURIComponent(city)}/add` : '/';
  const chips = CATEGORIES.filter((c) => c.key !== 'all');

  const btn = { display: 'inline-block', padding: '14px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' };
  const sec = { maxWidth: 720, margin: '0 auto', padding: '28px 18px' };
  const h2 = { fontSize: 21, margin: '0 0 14px', color: INK };

  return (
    <div style={{ background: '#FBF8F0', color: INK, minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #141F29 0%, #1E2F3F 100%)', padding: '34px 18px 38px', textAlign: 'center' }}>
        <div style={{ color: '#E0B864', fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Verilo</div>
        {city && <div style={{ color: '#E0B864', fontWeight: 800, fontSize: 13, letterSpacing: 0.4, marginBottom: 8 }}>{city.toUpperCase()} KE PROFESSIONALS KE LIYE</div>}
        <h1 style={{ color: 'white', fontSize: 27, lineHeight: 1.25, margin: '0 auto 10px', maxWidth: 520 }}>
          Apna kaam online dikhayein, customer seedha aapko call kare
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 1.55, margin: '0 auto 22px', maxWidth: 480 }}>
          Verilo par apni listing banayein. Plumber, electrician, tutor, tailor, DJ, photographer — sabke liye. Sirf <b>₹30/mahina</b>, koi commission nahi.
        </p>
        <Link href={start} style={{ ...btn, background: '#E0B864', color: '#141F29' }}>Apni Listing Banayein →</Link>
        <div style={{ marginTop: 14 }}>
          <Link href="/pricing" style={{ color: 'white', fontSize: 13.5, fontWeight: 700 }}>Verilo kaise kaam karta hai</Link>
        </div>
      </div>

      <div style={sec}>
        <h2 style={h2}>Aapko kya milega</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {BENEFITS.map(([ic, t, d]) => (
            <div key={t} style={{ background: 'white', border: `1px solid ${LINE}`, borderRadius: 14, padding: '14px 14px 15px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{ic}</div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{t}</div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        <div style={sec}>
          <h2 style={h2}>Shuru karna aasan hai</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {STEPS.map(([n, t, d]) => (
              <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: '0 0 34px', height: 34, borderRadius: '50%', background: RED, color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
                <div><div style={{ fontWeight: 800, fontSize: 14.5 }}>{t}</div><div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sec}>
        <h2 style={h2}>In sabke liye</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map((c) => (
            <span key={c.key} style={{ background: 'white', border: `1px solid ${LINE}`, borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 600 }}>{c.label}</span>
          ))}
        </div>
      </div>

      <div style={{ ...sec, paddingTop: 6 }}>
        <h2 style={h2}>Listing fee</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {PLANS.map(([t, p, note]) => (
            <div key={t} style={{ background: note === '2 mahine free' ? '#F6ECD6' : 'white', border: `${note === '2 mahine free' ? 2 : 1}px solid ${note === '2 mahine free' ? BROWN : LINE}`, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: MUTED }}>{t}</div>
              <div style={{ fontWeight: 800, fontSize: 24, margin: '2px 0' }}>{p}</div>
              <div style={{ fontSize: 12, color: BROWN, fontWeight: 700, minHeight: 16 }}>{note}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>Payment Razorpay se (UPI, card). Listing tabhi live hoti hai jab fee ho jaye.</div>
      </div>

      <div style={{ background: 'white', borderTop: `1px solid ${LINE}` }}>
        <div style={sec}>
          <h2 style={h2}>Aksar poochhe jaane wale sawal</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {FAQ.map(([q, a]) => (
              <div key={q} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{q}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...sec, textAlign: 'center' }}>
        <h2 style={{ ...h2, margin: '0 0 12px' }}>Aaj hi apni listing banayein</h2>
        <Link href={start} style={{ ...btn, background: RED, color: 'white' }}>Apni Listing Banayein →</Link>
        <div style={{ fontSize: 11.5, color: '#8B8576', marginTop: 18 }}>
          <Link href="/terms" style={{ color: '#8B8576' }}>Terms</Link> · <Link href="/privacy" style={{ color: '#8B8576' }}>Privacy</Link> · <Link href="/refund" style={{ color: '#8B8576' }}>Refund Policy</Link> · <Link href="/contact" style={{ color: '#8B8576' }}>Contact</Link>
        </div>
      </div>
    </div>
  );
}
