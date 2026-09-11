// Small line-art icons for each service category. All use currentColor so
// they inherit their tint from CSS (marigold on the category chip, ink on
// dark surfaces, etc). Kept deliberately simple/hand-set rather than a
// generic icon-font pack, to match Verilo's own visual identity.

const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const CATEGORY_ICONS = {
  all: (props) => (
    <svg {...common} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  ),
  plumber: (props) => (
    <svg {...common} {...props}>
      <path d="M9 3 3 9l3 3 6-6-3-3Z" />
      <path d="M12 9l6.5 6.5a2.4 2.4 0 1 1-3.4 3.4L8.6 12.4" />
      <path d="M17 13l3 3" />
    </svg>
  ),
  electrician: (props) => (
    <svg {...common} {...props}>
      <path d="M12.5 3 5 13.5h5.5L10 21l7.5-10.5H12L12.5 3Z" />
    </svg>
  ),
  mistri: (props) => (
    <svg {...common} {...props}>
      <path d="M14.5 6.5 18 3l3 3-3.5 3.5" />
      <path d="M16 8 6.5 17.5a2 2 0 1 0 2.8 2.8L19 10.6" />
      <path d="M4 20l3-1 1-3" />
    </svg>
  ),
  mechanic: (props) => (
    <svg {...common} {...props}>
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L15 12l-3-3 2.7-2.7Z" />
    </svg>
  ),
  'ac-repair': (props) => (
    <svg {...common} {...props}>
      <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  ),
  beautician: (props) => (
    <svg {...common} {...props}>
      <circle cx="6.5" cy="6.5" r="2.3" />
      <circle cx="6.5" cy="17.5" r="2.3" />
      <path d="M20 5 8.2 15M20 19 8.2 9" />
    </svg>
  ),
  tailor: (props) => (
    <svg {...common} {...props}>
      <circle cx="7" cy="8" r="3" />
      <path d="M9.5 10.2C13 13 15 16 15.5 20" />
      <path d="M15.5 9c1.7 0 3-.6 3.8-2M14.5 12.5c1.8.4 3.3.1 4.6-1" />
    </svg>
  ),
  tuition: (props) => (
    <svg {...common} {...props}>
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
      <path d="M7 11v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5" />
    </svg>
  ),
  'milk-veg': (props) => (
    <svg {...common} {...props}>
      <path d="M10 3h4l1 3-1.3 1.3c-.5.5-.7 1.1-.7 1.8V19a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V9.1c0-.7-.2-1.3-.7-1.8L9 6l1-3Z" />
      <path d="M9 13h6" />
    </svg>
  ),
  other: (props) => (
    <svg {...common} {...props}>
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </svg>
  ),
};

export function CategoryIcon({ name, ...props }) {
  const Icon = CATEGORY_ICONS[name] || CATEGORY_ICONS.other;
  return <Icon {...props} />;
}
