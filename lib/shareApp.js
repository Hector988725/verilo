// Shared "Share Verilo" action — used on the state picker, district picker,
// and city listing page, so it's available at every step of finding an area,
// not just the very first screen.
export function shareApp() {
  if (typeof window === 'undefined') return;
  const url = window.location.origin;
  const shareData = { title: 'Verilo', text: 'Verilo — find trusted local plumbers, electricians, tutors and more near you.', url };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => alert('Link copied! Share it with anyone.'));
  }
}

// Lets a provider share their own listing's public profile link — used on
// the provider dashboard so they can send their card straight to customers.
export function shareListing({ cityName, id, name }) {
  if (typeof window === 'undefined') return;
  const url = `${window.location.origin}/city/${encodeURIComponent(cityName)}/${id}`;
  const shareData = { title: name ? `${name} — Verilo` : 'Verilo', text: `Check out my listing on Verilo${name ? ` — ${name}` : ''}:`, url };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => alert('Link copied! Share it with your customers.'));
  }
}
