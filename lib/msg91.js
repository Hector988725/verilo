// Server-side verification for MSG91's OTP Widget flow. The widget itself
// (loaded client-side in components/PhoneOtpVerify.js) handles sending and
// collecting the OTP; once the user enters it correctly, the widget hands
// back a JWT "access-token". We must confirm that token is genuine with
// MSG91 before trusting it — a client could otherwise fake the onVerified
// callback in devtools.
//
// Env var needed: MSG91_AUTH_KEY — this is the account's secret Auth Key
// (MSG91 dashboard -> OTP Widget -> Server-Side Integration -> "Get
// Authkey"), NOT the widget's public tokenAuth used in the browser.

export async function verifyWidgetAccessToken(accessToken) {
  if (!accessToken) return { error: 'Missing access token' };
  if (!process.env.MSG91_AUTH_KEY) return { error: 'MSG91_AUTH_KEY not configured' };

  try {
    const res = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ authkey: process.env.MSG91_AUTH_KEY, 'access-token': accessToken }),
    });
    const data = await res.json();
    // Per MSG91: a bad authkey can come back as HTTP 200 with type:'error'/code:'201' —
    // never trust a 200 status alone, always check the payload's type.
    if (data.type === 'success') return { success: true, data };
    return { error: data.message || 'Could not verify OTP token' };
  } catch (err) {
    return { error: err.message };
  }
}

// MSG91 verify response mein agar verified mobile number kisi mobile/phone/identifier jaisi field mein ho
// to 10-digit nikalta hai. Sirf aisi naam wali fields dekhta hai (andaze se random numbers nahi),
// taaki galti se sahi user na rok de. Na mile to null (tab phone binding client ke daave par rehti hai).
export function extractMobile(data) {
  let found = null;
  (function walk(v, key) {
    if (found || v == null) return;
    if (typeof v === 'object') {
      for (const [k, val] of Object.entries(v)) walk(val, k);
    } else if (key && /mobile|phone|identifier|contact|number/i.test(key)) {
      const m = String(v).replace(/[\s-]/g, '').match(/^\+?(?:91)?([6-9]\d{9})$/);
      if (m) found = m[1];
    }
  })(data, '');
  return found;
}
