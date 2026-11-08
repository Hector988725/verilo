// MET Norway (api.met.no) ka symbol_code -> mascot ke liye simple mausam.
export function mapSymbol(symbol, fallbackDay) {
  const s = String(symbol || '');
  const base = s.split('_')[0];
  let day = fallbackDay;
  if (s.endsWith('_night')) day = false;
  else if (s.endsWith('_day')) day = true;
  let kind = 'clear';
  if (/rain|sleet|thunder|drizzle|shower/.test(base)) kind = 'rain';
  else if (/snow|fog|^cloudy$/.test(base)) kind = 'cloud';
  else if (/partlycloudy|fair/.test(base)) kind = 'part';
  return { kind, day };
}

// India (IST) me din ka andaza, jab symbol me day/night na ho.
export function isDayIST(now = new Date()) {
  const h = (now.getUTCHours() + 5 + (now.getUTCMinutes() + 30 >= 60 ? 1 : 0)) % 24;
  return h >= 6 && h < 18;
}
