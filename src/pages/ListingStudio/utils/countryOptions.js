// Full country list for Listing Studio dropdowns
// Kept in sync with DIRECTORY_COUNTRIES in AdminDashboard.jsx
// value = slug used in DB, label = display name
//
// Countries added via the admin Countries page are stored in
// localStorage under 'lwd_extra_countries' and merged in at runtime.

const BASE_COUNTRY_OPTIONS = [
  { value: 'italy',          label: 'Italy' },
  { value: 'france',         label: 'France' },
  { value: 'uk',             label: 'United Kingdom' },
  { value: 'spain',          label: 'Spain' },
  { value: 'usa',            label: 'United States' },
  { value: 'portugal',       label: 'Portugal' },
  { value: 'greece',         label: 'Greece' },
  { value: 'ireland',        label: 'Ireland' },
  { value: 'croatia',        label: 'Croatia' },
  { value: 'switzerland',    label: 'Switzerland' },
  { value: 'austria',        label: 'Austria' },
  { value: 'germany',        label: 'Germany' },
  { value: 'netherlands',    label: 'Netherlands' },
  { value: 'denmark',        label: 'Denmark' },
  { value: 'sweden',         label: 'Sweden' },
  { value: 'norway',         label: 'Norway' },
  { value: 'iceland',        label: 'Iceland' },
  { value: 'hungary',        label: 'Hungary' },
  { value: 'czech-republic', label: 'Czech Republic' },
  { value: 'poland',         label: 'Poland' },
  { value: 'romania',        label: 'Romania' },
  { value: 'cyprus',         label: 'Cyprus' },
  { value: 'malta',          label: 'Malta' },
  { value: 'montenegro',     label: 'Montenegro' },
  { value: 'slovenia',       label: 'Slovenia' },
  { value: 'gibraltar',      label: 'Gibraltar' },
  { value: 'monaco',         label: 'Monaco' },
  { value: 'turkey',         label: 'Turkey' },
  { value: 'uae',            label: 'United Arab Emirates' },
  { value: 'jordan',         label: 'Jordan' },
  { value: 'qatar',          label: 'Qatar' },
  { value: 'oman',           label: 'Oman' },
  { value: 'egypt',          label: 'Egypt' },
  { value: 'morocco',        label: 'Morocco' },
  { value: 'south-africa',   label: 'South Africa' },
  { value: 'kenya',          label: 'Kenya' },
  { value: 'tanzania',       label: 'Tanzania' },
  { value: 'mauritius',      label: 'Mauritius' },
  { value: 'seychelles',     label: 'Seychelles' },
  { value: 'thailand',       label: 'Thailand' },
  { value: 'indonesia',      label: 'Indonesia' },
  { value: 'malaysia',       label: 'Malaysia' },
  { value: 'singapore',      label: 'Singapore' },
  { value: 'philippines',    label: 'Philippines' },
  { value: 'vietnam',        label: 'Vietnam' },
  { value: 'india',          label: 'India' },
  { value: 'sri-lanka',      label: 'Sri Lanka' },
  { value: 'japan',          label: 'Japan' },
  { value: 'maldives',       label: 'Maldives' },
  { value: 'bali',           label: 'Bali' },
  { value: 'fiji',           label: 'Fiji' },
  { value: 'australia',      label: 'Australia' },
  { value: 'new-zealand',    label: 'New Zealand' },
  { value: 'canada',         label: 'Canada' },
  { value: 'mexico',         label: 'Mexico' },
  { value: 'caribbean',      label: 'Caribbean' },
  { value: 'bahamas',        label: 'Bahamas' },
  { value: 'costa-rica',     label: 'Costa Rica' },
  { value: 'brazil',         label: 'Brazil' },
  { value: 'colombia',       label: 'Colombia' },
  { value: 'argentina',      label: 'Argentina' },
  { value: 'cambodia',       label: 'Cambodia' },
];

// localStorage key used by the admin Countries page to persist custom additions
const LS_KEY = 'lwd_extra_countries';

// Read any admin-added countries and merge (dedup by value/slug)
function buildCountryOptions() {
  let extra = [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) extra = JSON.parse(raw);
  } catch {}
  const baseValues = new Set(BASE_COUNTRY_OPTIONS.map(c => c.value));
  const merged = [
    ...BASE_COUNTRY_OPTIONS,
    ...extra
      .filter(c => c.value && c.label && !baseValues.has(c.value))
      .map(c => ({ value: c.value, label: c.label })),
  ];
  return merged.sort((a, b) => a.label.localeCompare(b.label));
}

export const COUNTRY_OPTIONS = buildCountryOptions();

// Call this after adding a new country via the admin UI to keep the list fresh
export function getCountryOptions() {
  return buildCountryOptions();
}
