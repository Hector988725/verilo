// App khulte hi 3D "H" (Hector365) ghoomta hai: 180 par "V" (Verilo), aur 540 par V par ruk kar app dikhta hai.
// Server se hi page ke saath aata hai aur ek chhoti inline script usi waqt decide karti hai ki dikhana hai ya nahi,
// isliye JavaScript load hone ka intezaar nahi karta (pehle wala version late shuru hota tha).
// Dikhta hai: home, provider login/dashboard, admin (har session me ek baar) aur installed app me kahin bhi.
const LAYERS = 40;
const STEP = 0.7;

function shade(i) {
  const t = i / (LAYERS - 1);
  const c = (a, b) => Math.round(a + (b - a) * t);
  return `rgb(${c(88, 224)}, ${c(64, 184)}, ${c(20, 100)})`;
}
const z = (i) => (i - (LAYERS - 1) / 2) * STEP;

const glyph = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
  fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, fontSize: 120, lineHeight: 1,
};

const css = `
#v-splash{display:none;position:fixed;inset:0;z-index:99999;flex-direction:column;align-items:center;justify-content:center;gap:26px;
  background:radial-gradient(circle at 50% 40%, #1E2F3F 0%, #0B1219 100%);cursor:pointer;opacity:1;transition:opacity .45s ease}
#v-splash.v-out{opacity:0}
@keyframes vsSpin{0%{transform:rotateY(0deg) rotateX(-8deg)}100%{transform:rotateY(540deg) rotateX(-8deg)}}
@keyframes vsIn{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:scale(1)}}
@keyframes vsText{0%,70%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
`;

// Chhoti script: dikhana hai ya nahi -> decide, 2.7 sec baad fade, tap par turant band.
const script = `(function(){
  var el=document.getElementById('v-splash'); if(!el) return;
  var KEY='verilo_splash_seen', show=false;
  try{
    var seen=sessionStorage.getItem(KEY)==='1';
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
    var p=location.pathname.replace(/^\\/+|\\/+$/g,'');
    var okPath=['','provider/login','provider/dashboard','admin'].indexOf(p)>-1;
    show=!seen&&!reduced&&(standalone||okPath);
    if(show) sessionStorage.setItem(KEY,'1');
  }catch(e){}
  if(!show) return;
  el.style.display='flex';
  function close(){ el.className='v-out'; setTimeout(function(){ el.style.display='none'; },450); }
  el.addEventListener('click',close);
  setTimeout(close,2700);
})();`;

export default function BrandSplash() {
  const layers = Array.from({ length: LAYERS }, (_, i) => i);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div id="v-splash" suppressHydrationWarning>
        <div style={{ perspective: 700, width: 130, height: 130, animation: 'vsIn .35s ease-out both' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', animation: 'vsSpin 2s cubic-bezier(.45,.05,.25,1) .25s both' }}>
            {layers.map((i) => (
              <div key={'h' + i} style={{ ...glyph, color: shade(i), transform: `translateZ(${z(i)}px)` }}>H</div>
            ))}
            {layers.map((i) => (
              <div key={'b' + i} style={{ ...glyph, color: shade(i), transform: `rotateY(180deg) translateZ(${z(i)}px)` }}>V</div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', animation: 'vsText 2.3s ease-out both' }}>
          <div style={{ color: 'white', fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 22 }}>Verilo</div>
          <div style={{ color: '#E0B864', fontSize: 12, letterSpacing: 1.2, marginTop: 5, fontWeight: 700 }}>BY HECTOR365</div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
}
