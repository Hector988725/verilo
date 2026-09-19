// Small "cartoon" style icons for each service category — bolder, rounder,
// filled shapes rather than hairline strokes, so the category strip feels
// playful/friendly. Still built with currentColor so they correctly flip
// to white when their chip is selected (see .cat-chip.active in globals.css) —
// a hard-coded multi-color image would break that swap, so the "cartoon"
// look here comes from shape (chunky, rounded, filled) rather than a
// fixed color palette per icon.

const common = { width: 22, height: 22, viewBox: '0 0 24 24' };

export const CATEGORY_ICONS = {
  all: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M12 3.2 3 10.5v1.5h1.5V20a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4.5h3V20a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1v-8h1.5v-1.5L12 3.2Z" />
    </svg>
  ),
  plumber: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M7.8 2.6a3.3 3.3 0 0 0-1 5.6l-3.5 3.5a1.2 1.2 0 0 0 0 1.7l2.2 2.2a1.2 1.2 0 0 0 1.7 0l3.5-3.5a3.3 3.3 0 0 0 4.3-4.3l-1.9 1.9-1.7-.5-.5-1.7 1.9-1.9A3.3 3.3 0 0 0 7.8 2.6Z" />
      <circle cx="18.3" cy="18.3" r="3.1" />
    </svg>
  ),
  electrician: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M13.2 2 4.6 13.8h5.7L9.6 22l9.1-12.4h-5.9L13.2 2Z" />
    </svg>
  ),
  mistri: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M15.8 3.3a1 1 0 0 1 1.4 0l3.5 3.5a1 1 0 0 1 0 1.4l-1.7 1.7-4.9-4.9 1.7-1.7Z" />
      <path d="M13.4 5.7 3.9 15.2a2.6 2.6 0 0 0-.7 1.3l-.9 3.8a.8.8 0 0 0 1 1l3.8-.9c.5-.1 1-.4 1.3-.7l9.5-9.5-4.5-4.5Z" />
    </svg>
  ),
  mechanic: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M20.6 8.4a5 5 0 0 1-6.4 6.4l-6.9 6.9a2 2 0 0 1-2.8-2.8l6.9-6.9a5 5 0 0 1 6.4-6.4L15.4 8l.7 1.9 1.9.7 2.6-2.2Z" />
    </svg>
  ),
  'ac-repair': (props) => (
    <svg {...common} {...props} fill="currentColor">
      <rect x="3" y="6" width="18" height="7" rx="2.5" />
      <path d="M6 15.5a1 1 0 0 1 2 0v3.8a1 1 0 1 1-2 0v-3.8Z" />
      <path d="M11 15.5a1 1 0 0 1 2 0v5.8a1 1 0 1 1-2 0v-5.8Z" />
      <path d="M16 15.5a1 1 0 0 1 2 0v2.8a1 1 0 1 1-2 0v-2.8Z" />
    </svg>
  ),
  beautician: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <circle cx="6.3" cy="6.3" r="2.6" />
      <circle cx="6.3" cy="17.7" r="2.6" />
      <path d="M20.5 4.5 8.4 11.3l1.7 1 12-6.8-1.6-1Z" />
      <path d="M20.5 19.5 8.4 12.7l1.7-1 12 6.8-1.6 1Z" />
    </svg>
  ),
  tailor: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <circle cx="7.3" cy="7.3" r="3.3" />
      <circle cx="7.3" cy="7.3" r="1.1" fill="var(--paper, #fff)" />
      <path d="M9.6 9.6c3.8 2.8 6 6.3 6.6 10.6l2-.3c-.6-4.8-3.1-8.7-7.2-11.7L9.6 9.6Z" />
      <circle cx="17" cy="7.5" r="2.2" opacity="0.85" />
    </svg>
  ),
  tuition: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M12 3 2 8l10 5 8-4v6.2a1 1 0 0 0 2 0V8L12 3Z" />
      <path d="M6.5 11.3v4.4c0 1.8 2.5 3.3 5.5 3.3s5.5-1.5 5.5-3.3v-4.4l-5.5 2.7-5.5-2.7Z" />
    </svg>
  ),
  'milk-veg': (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M9.5 2h5l.6 2.5-1.7 1.7c-.4.4-.6.9-.6 1.5V20a2 2 0 0 1-2 2h-.8a2 2 0 0 1-2-2V7.7c0-.6-.2-1.1-.6-1.5L8.9 4.5 9.5 2Z" />
      <path d="M7.5 14c1.6.7 3.2.7 5 0" stroke="var(--paper, #fff)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  ),
  astrologer: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <circle cx="12" cy="13" r="6.2" />
      <circle cx="9.8" cy="11" r="1.4" fill="var(--paper, #fff)" opacity="0.85" />
      <path d="M6 3.5 6.9 6 9.4 6.9 6.9 7.8 6 10.3 5.1 7.8 2.6 6.9 5.1 6 6 3.5Z" />
      <path d="M18 2.2 18.6 4 20.4 4.6 18.6 5.2 18 7 17.4 5.2 15.6 4.6 17.4 4 18 2.2Z" />
    </svg>
  ),
  transport: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M4.5 15V9.8a1.6 1.6 0 0 1 1.2-1.5l1.6-.4c.5-1.7 1-3.3 1.4-3.9.4-.6 1-.9 2-.9h2.6c1 0 1.6.3 2 .9.4.6.9 2.2 1.4 3.9l1.6.4c.6.1 1.1.3 1.5.6.4.3.7.8.7 1.4V15Z" opacity="0.001" />
      <rect x="3.3" y="13.5" width="17.4" height="4.3" rx="1.6" />
      <path d="M5.3 13.5c.4-1.6.9-3.3 1.4-4.6.4-1 1-1.5 2.1-1.5h6.4c1.1 0 1.7.5 2.1 1.5.5 1.3 1 3 1.4 4.6H5.3Z" />
      <circle cx="7" cy="19.8" r="1.6" fill="var(--paper, #fff)" />
      <circle cx="17" cy="19.8" r="1.6" fill="var(--paper, #fff)" />
    </svg>
  ),
  tattoo: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <path d="M13 2.2c2.4 2.8 3.4 5.2 3.4 7.4a3.4 3.4 0 1 1-6.8 0c0-2.2 1-4.6 3.4-7.4Z" />
      <path d="M6.5 20.5c1-1.6 2-3.2 3.5-3.9M17.5 20.5c-1-1.6-2-3.2-3.5-3.9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  ),
  other: (props) => (
    <svg {...common} {...props} fill="currentColor">
      <circle cx="5.5" cy="12" r="2.1" />
      <circle cx="12" cy="12" r="2.1" />
      <circle cx="18.5" cy="12" r="2.1" />
    </svg>
  ),
};

export function CategoryIcon({ name, ...props }) {
  const Icon = CATEGORY_ICONS[name] || CATEGORY_ICONS.other;
  return <Icon {...props} />;
}
