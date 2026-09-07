// Stores { [listing_id]: manage_token } in localStorage. The token itself
// (not just the listing id) is kept so the client can prove ownership on
// every mutating request — the server always re-verifies it before acting.
const KEY = 'verilo_my_listings_v2';

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch (e) {
    return {};
  }
}

export function getMyToken(listingId) {
  return readMap()[listingId] || null;
}

export function saveMyToken(listingId, token) {
  try {
    const map = readMap();
    map[listingId] = token;
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {}
}

export function forgetMyToken(listingId) {
  try {
    const map = readMap();
    delete map[listingId];
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {}
}
