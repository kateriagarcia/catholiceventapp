export const CATEGORIES = [
  { value: 'feast', label: 'Feast Day' },
  { value: 'adoration', label: 'Adoration' },
  { value: 'fish_fry', label: 'Fish Fry' },
  { value: 'festival', label: 'Festival' },
  { value: 'retreat', label: 'Retreat' },
  { value: 'novena', label: 'Novena' },
  { value: 'other', label: 'Other' },
];

export const AUDIENCE_TAGS = [
  { value: 'young_adults', label: 'Young Adults' },
  { value: 'kids', label: 'Kids' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'married_couples', label: 'Married Couples' },
  { value: 'families', label: 'Families' },
  { value: 'general', label: 'General / Everyone' },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function audienceLabel(value) {
  return AUDIENCE_TAGS.find((a) => a.value === value)?.label || value;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
