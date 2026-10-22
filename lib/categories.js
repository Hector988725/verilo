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
  { key: 'astrologer', label: 'Astrologer' },
  { key: 'transport', label: 'Transport' },
  { key: 'tattoo', label: 'Tattoo Artist' },
  // Events: weddings, parties, functions. "group" only decides where they sit in the chip strip and the form dropdown.
  { key: 'dj', label: 'DJ & Sound', group: 'events' },
  { key: 'band', label: 'Band / Live Music', group: 'events' },
  { key: 'photographer', label: 'Photographer', group: 'events' },
  { key: 'videographer', label: 'Videographer', group: 'events' },
  { key: 'makeup-artist', label: 'Makeup Artist', group: 'events' },
  { key: 'event-pro', label: 'Event Planner', group: 'events' },
  { key: 'other', label: 'Other' },
];

// A distinct accent color per category (used on the icon chips/badges), so the
// category strip reads like the mockup's color-coded icons instead of one flat tint.
export const CATEGORY_COLORS = {
  all: '#141F29',
  plumber: '#2C5F8A',
  electrician: '#A9782E',
  mistri: '#6B4A2E',
  mechanic: '#4A5560',
  'ac-repair': '#1F7A72',
  beautician: '#A03D5C',
  tailor: '#5B4593',
  tuition: '#3D4F8A',
  'milk-veg': '#3D7A3D',
  astrologer: '#6B3FA0',
  transport: '#2E7A8A',
  tattoo: '#7A2E3D',
  dj: '#6A3FB5',
  band: '#B5453F',
  photographer: '#2E6F9E',
  videographer: '#8A3F6B',
  'makeup-artist': '#C2547A',
  'event-pro': '#B07A1F',
  other: '#6B6259',
  shops: '#B4532A',
};

export function catColor(key) {
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.other;
}

// Short taglines shown on the category banner — kept factual, not promises
// about things Verilo doesn't actually do (no "book now", no fake urgency).
export const CATEGORY_TAGLINES = {
  plumber: 'Leaks, fittings, repairs — sorted fast.',
  electrician: 'Wiring, fittings, and fixes you can trust.',
  mistri: 'Furniture, fittings, and home carpentry.',
  mechanic: 'Vehicle repairs from trusted local hands.',
  'ac-repair': 'Keep your appliances running smoothly.',
  beautician: 'Look good, feel good — right in your area.',
  tailor: 'Perfect fit, stitched close to home.',
  tuition: 'Find the right teacher for every subject.',
  'milk-veg': 'Fresh essentials, delivered locally.',
  astrologer: 'Guidance and readings from trusted local astrologers.',
  transport: 'Autos, cabs, and local transport, sorted.',
  tattoo: 'Skilled tattoo artists, right in your area.',
  dj: 'Music and sound for weddings, parties and functions.',
  band: 'Live bands and musicians for your function.',
  photographer: 'Photos for weddings, events and portraits.',
  videographer: 'Wedding films, event videos and shoots.',
  'makeup-artist': 'Bridal and party makeup, close to home.',
  'event-pro': 'Planners, decorators and anchors for your event.',
  other: 'More local help, all in one place.',
};

export function catTagline(key) {
  return CATEGORY_TAGLINES[key] || 'Trusted local help, all in one place.';
}

// Review prompts tailored per category, so "share your experience" actually
// asks something relevant — how well someone teaches is a different question
// than how good someone's plumbing work was.
export const CATEGORY_REVIEW_PROMPTS = {
  plumber: 'How was the quality of their plumbing work? Were they on time?',
  electrician: 'Was the electrical work safe, tidy, and reliable?',
  mistri: 'How was the quality of their carpentry/furniture work?',
  mechanic: 'How was the repair quality — did it fix the issue properly?',
  'ac-repair': 'Did they fix the issue well? Was the service reliable?',
  beautician: 'How was the service quality and hygiene?',
  tailor: 'How was the fitting, stitching quality, and delivery time?',
  tuition: 'How well do they teach? Would you recommend them to other students?',
  'milk-veg': 'Was the quality fresh and delivery on time?',
  astrologer: 'How accurate and helpful was the reading/guidance?',
  transport: 'Was the ride safe, on time, and fairly priced?',
  tattoo: 'How was the hygiene, skill, and final result?',
  dj: 'How was the music and sound quality? Were they on time and easy to work with?',
  band: 'How was the performance? Were they on time and professional?',
  photographer: 'How were the photos and the delivery time? Were they easy to work with?',
  videographer: 'How was the video quality and editing? Was it delivered on time?',
  'makeup-artist': 'How was the makeup quality and hygiene? Did it last through the event?',
  'event-pro': 'How well was the event planned and run? Were they reliable?',
  other: 'Share your experience with this provider.',
};

// Label and example text for the "Specialization" field in the add and edit forms (one list for both pages).
export const SPECIALIZATION_LABELS = {
  tuition: { label: 'Subject(s) You Teach', placeholder: 'e.g. Maths & Science, Class 9-12' },
  plumber: { label: 'Specialization', placeholder: 'e.g. Pipe fitting, bathroom fitting' },
  electrician: { label: 'Specialization', placeholder: 'e.g. Wiring, AC repair, appliance repair' },
  mistri: { label: 'Specialization', placeholder: 'e.g. Furniture, doors, woodwork' },
  mechanic: { label: 'Specialization', placeholder: 'e.g. Bike repair, car servicing' },
  'ac-repair': { label: 'Specialization', placeholder: 'e.g. AC servicing, fridge, washing machine repair' },
  beautician: { label: 'Services Offered', placeholder: 'e.g. Haircut, facial, bridal makeup' },
  tailor: { label: 'Specialization', placeholder: 'e.g. Blouse stitching, alterations, uniforms' },
  'milk-veg': { label: 'What You Deliver', placeholder: 'e.g. Fresh milk, seasonal vegetables' },
  dj: { label: 'What You Provide', placeholder: 'e.g. DJ, sound system, lights, wedding & party' },
  band: { label: 'Type of Music / Lineup', placeholder: 'e.g. Live band, dhol, brass band, 5 members' },
  photographer: { label: 'Specialization', placeholder: 'e.g. Wedding, pre-wedding, portraits, events' },
  videographer: { label: 'Specialization', placeholder: 'e.g. Wedding films, drone shots, event videos' },
  'makeup-artist': { label: 'Services Offered', placeholder: 'e.g. Bridal, party, HD makeup, hairstyling' },
  'event-pro': { label: 'What You Do', placeholder: 'e.g. Event planning, decoration, anchor / emcee' },
  other: { label: 'Specialization', placeholder: 'What do you specialize in?' },
};

export function catReviewPrompt(key) {
  return CATEGORY_REVIEW_PROMPTS[key] || CATEGORY_REVIEW_PROMPTS.other;
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

// Event types an event professional can say they do (shown as tags on their profile).
export const EVENT_TYPES = ['Wedding', 'Engagement', 'Reception', 'Birthday', 'Corporate', 'Festival / Puja', 'College / School', 'Other'];

export function isEventCategory(key) {
  return CATEGORIES.find((c) => c.key === key)?.group === 'events';
}
