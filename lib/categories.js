export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'plumber', label: 'Plumber' },
  { key: 'electrician', label: 'Electrician' },
  { key: 'mistri', label: 'Carpenter/Mistri' },
  { key: 'mechanic', label: 'Mechanic' },
  { key: 'ac-repair', label: 'AC/Appliance Repair' },
  { key: 'beautician', label: 'Beauty Parlour/Salon' },
  { key: 'tailor', label: 'Tailor' },
  { key: 'tuition', label: 'Tuition' },
  { key: 'milk-veg', label: 'Milk/Veg Delivery' },
  { key: 'other', label: 'Other' },
];

export function catLabel(key) {
  const c = CATEGORIES.find((c) => c.key === key);
  return c ? c.label : key;
}

export function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function isInTrial(listing) {
  if (!listing.trial_ends_at) return false;
  return new Date(listing.trial_ends_at) > new Date();
}

export function daysLeft(listing) {
  const diff = new Date(listing.trial_ends_at) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}
