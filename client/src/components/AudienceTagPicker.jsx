import { AUDIENCE_TAGS } from '../lib/constants';

export default function AudienceTagPicker({ value = [], onChange }) {
  function toggle(tagValue) {
    if (value.includes(tagValue)) {
      onChange(value.filter((v) => v !== tagValue));
    } else {
      onChange([...value, tagValue]);
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {AUDIENCE_TAGS.map((tag) => (
        <button
          key={tag.value}
          type="button"
          className={`chip ${value.includes(tag.value) ? 'active' : ''}`}
          onClick={() => toggle(tag.value)}
          aria-pressed={value.includes(tag.value)}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
