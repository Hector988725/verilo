export const CATEGORIES = [
  { key: 'all', label: 'All' },
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

// A distinct accent color per category (used on the icon chips/badges), so the
// category strip reads like the mockup's color-coded icons instead of one flat tint.
export const CATEGORY_COLORS = {
  all: '#241F16',
  plumber: '#2F7FC7',
  electrician: '#E0A100',
  mistri: '#8B5E34',
  mechanic: '#5B6B7C',
  'ac-repair': '#2AA6A0',
  beautician: '#D6598F',
  tailor: '#7B5CB8',
  tuition: '#5C6BC0',
  'milk-veg': '#4CA24C',
  other: '#8A7F6E',
};

export function catColor(key) {
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.other;
}

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
