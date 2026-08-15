const express = require('express');
const { createEvents } = require('ics');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');
const { serializeEvent, CATEGORIES, AUDIENCE_TAGS } = require('../lib/serialize');
const { distanceMiles } = require('../lib/geo');

const router = express.Router();

function validateEventBody(body, { partial = false } = {}) {
  const errors = [];
  const required = ['parish_id', 'title', 'category', 'start_datetime'];
  if (!partial) {
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        errors.push(`${field} is required`);
      }
    }
  }
  if (body.category !== undefined && !CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (body.audience_tags !== undefined) {
    if (!Array.isArray(body.audience_tags) || body.audience_tags.some((t) => !AUDIENCE_TAGS.includes(t))) {
      errors.push(`audience_tags must be an array of: ${AUDIENCE_TAGS.join(', ')}`);
    }
  }
  return errors;
}

// GET /api/events — the core search/browse endpoint.
// Filters: state, diocese_id, parish_id, category, audience_tags (csv),
// start_after, start_before, q (text search), lat/lng/radius_miles.
router.get('/', (req, res) => {
  const {
    state,
    diocese_id,
    parish_id,
    category,
    audience_tags,
    start_after,
    start_before,
    q,
    lat,
    lng,
    radius_miles,
    include_past,
    limit,
  } = req.query;

  let sql = `
    SELECT e.*, p.name AS parish_name, p.address AS parish_address, p.lat AS parish_lat, p.lng AS parish_lng,
           d.id AS diocese_id, d.name AS diocese_name, d.state AS diocese_state
    FROM events e
    JOIN parishes p ON p.id = e.parish_id
    JOIN dioceses d ON d.id = p.diocese_id
    WHERE e.is_active = 1
  `;
  const params = [];

  if (!include_past) {
    sql += " AND e.start_datetime >= datetime('now', '-1 hour')";
  }
  if (state) {
    sql += ' AND d.state = ?';
    params.push(state);
  }
  if (diocese_id) {
    sql += ' AND d.id = ?';
    params.push(diocese_id);
  }
  if (parish_id) {
    sql += ' AND p.id = ?';
    params.push(parish_id);
  }
  if (category) {
    sql += ' AND e.category = ?';
    params.push(category);
  }
  if (start_after) {
    sql += ' AND e.start_datetime >= ?';
    params.push(start_after);
  }
  if (start_before) {
    sql += ' AND e.start_datetime <= ?';
    params.push(start_before);
  }
  if (q) {
    sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR p.name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY e.start_datetime ASC';

  let events = db.prepare(sql).all(...params).map(serializeEvent);

  if (audience_tags) {
    const wanted = String(audience_tags).split(',').filter(Boolean);
    if (wanted.length > 0) {
      events = events.filter((e) => e.audience_tags.some((t) => wanted.includes(t)));
    }
  }

  if (lat && lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radius = radius_miles ? Number(radius_miles) : 50;
    events = events
      .filter((e) => e.parish_lat != null && e.parish_lng != null)
      .map((e) => ({ ...e, distance_miles: distanceMiles(latNum, lngNum, e.parish_lat, e.parish_lng) }))
      .filter((e) => e.distance_miles <= radius)
      .sort((a, b) => a.distance_miles - b.distance_miles);
  }

  if (limit) {
    events = events.slice(0, Number(limit));
  }

  res.json(events);
});

router.get('/:id', (req, res) => {
  const event = db
    .prepare(
      `SELECT e.*, p.name AS parish_name, p.address AS parish_address, p.website AS parish_website,
              p.phone AS parish_phone, p.lat AS parish_lat, p.lng AS parish_lng, p.is_verified AS parish_verified,
              d.id AS diocese_id, d.name AS diocese_name
       FROM events e
       JOIN parishes p ON p.id = e.parish_id
       JOIN dioceses d ON d.id = p.diocese_id
       WHERE e.id = ?`
    )
    .get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(serializeEvent(event));
});

// "Add to Calendar" — .ics export for a single event.
router.get('/:id/ics', (req, res) => {
  const event = db
    .prepare(
      `SELECT e.*, p.name AS parish_name, p.address AS parish_address
       FROM events e JOIN parishes p ON p.id = e.parish_id
       WHERE e.id = ?`
    )
    .get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : new Date(start.getTime() + 60 * 60 * 1000);

  const { error, value } = createEvents([
    {
      title: event.title,
      description: event.description || '',
      location: event.parish_address || event.parish_name,
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      startInputType: 'local',
    },
  ]);

  if (error) {
    return res.status(500).json({ error: 'Could not generate calendar file' });
  }

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="event-${event.id}.ics"`);
  res.send(value);
});

router.post('/', requireAdmin, (req, res) => {
  const errors = validateEventBody(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });
  const b = req.body;
  const result = db
    .prepare(
      `INSERT INTO events (parish_id, title, description, category, audience_tags, start_datetime, end_datetime, is_recurring, recurrence_rule, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      b.parish_id,
      b.title,
      b.description || null,
      b.category,
      JSON.stringify(b.audience_tags || []),
      b.start_datetime,
      b.end_datetime || null,
      b.is_recurring ? 1 : 0,
      b.recurrence_rule || null,
      b.is_active === undefined ? 1 : b.is_active ? 1 : 0
    );
  res.status(201).json(serializeEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid)));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  const errors = validateEventBody(req.body, { partial: true });
  if (errors.length > 0) return res.status(400).json({ errors });

  const b = req.body;
  const merged = {
    parish_id: b.parish_id ?? existing.parish_id,
    title: b.title ?? existing.title,
    description: b.description ?? existing.description,
    category: b.category ?? existing.category,
    audience_tags: b.audience_tags !== undefined ? JSON.stringify(b.audience_tags) : existing.audience_tags,
    start_datetime: b.start_datetime ?? existing.start_datetime,
    end_datetime: b.end_datetime ?? existing.end_datetime,
    is_recurring: b.is_recurring !== undefined ? (b.is_recurring ? 1 : 0) : existing.is_recurring,
    recurrence_rule: b.recurrence_rule ?? existing.recurrence_rule,
    is_active: b.is_active !== undefined ? (b.is_active ? 1 : 0) : existing.is_active,
  };
  db.prepare(
    `UPDATE events SET parish_id=?, title=?, description=?, category=?, audience_tags=?, start_datetime=?, end_datetime=?, is_recurring=?, recurrence_rule=?, is_active=? WHERE id=?`
  ).run(
    merged.parish_id,
    merged.title,
    merged.description,
    merged.category,
    merged.audience_tags,
    merged.start_datetime,
    merged.end_datetime,
    merged.is_recurring,
    merged.recurrence_rule,
    merged.is_active,
    req.params.id
  );
  res.json(serializeEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.status(204).end();
});

module.exports = router;
