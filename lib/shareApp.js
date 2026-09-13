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
