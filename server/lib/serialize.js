const CATEGORIES = ['feast', 'adoration', 'fish_fry', 'festival', 'retreat', 'novena', 'other'];
const AUDIENCE_TAGS = ['young_adults', 'kids', 'men', 'women', 'married_couples', 'families', 'general'];

function parseAudienceTags(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((t) => AUDIENCE_TAGS.includes(t)) : [];
  } catch {
    return [];
  }
}

function serializeEvent(row) {
  if (!row) return row;
  return {
    ...row,
    audience_tags: parseAudienceTags(row.audience_tags),
    is_recurring: Boolean(row.is_recurring),
    is_active: Boolean(row.is_active),
  };
}

function serializeParish(row) {
  if (!row) return row;
  return { ...row, is_verified: Boolean(row.is_verified) };
}

function serializeSubmission(row) {
  if (!row) return row;
  return {
    ...row,
    audience_tags: parseAudienceTags(row.audience_tags),
    is_recurring: Boolean(row.is_recurring),
  };
}

module.exports = {
  CATEGORIES,
  AUDIENCE_TAGS,
  parseAudienceTags,
  serializeEvent,
  serializeParish,
  serializeSubmission,
};
