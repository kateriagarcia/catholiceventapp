const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');
const { serializeSubmission, serializeEvent, CATEGORIES, AUDIENCE_TAGS } = require('../lib/serialize');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: submit a new event for review. Not written directly to `events`.
router.post('/', (req, res) => {
  const b = req.body;

  // Honeypot: a hidden field real users never fill in. Bots that
  // autofill every field trip this and get a silent 200 (no signal to retry).
  if (b.website_url) {
    return res.status(200).json({ ok: true });
  }

  const errors = [];
  if (!b.title) errors.push('title is required');
  if (!b.category || !CATEGORIES.includes(b.category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  if (!b.start_datetime) errors.push('start_datetime is required');
  if (!b.submitted_by_email || !EMAIL_RE.test(b.submitted_by_email)) errors.push('a valid submitted_by_email is required');
  if (!b.parish_id && !b.parish_name_text) errors.push('parish_id or parish_name_text is required');
  if (b.audience_tags !== undefined) {
    if (!Array.isArray(b.audience_tags) || b.audience_tags.some((t) => !AUDIENCE_TAGS.includes(t))) {
      errors.push(`audience_tags must be an array of: ${AUDIENCE_TAGS.join(', ')}`);
    }
  }
  if (errors.length > 0) return res.status(400).json({ errors });

  const result = db
    .prepare(
      `INSERT INTO submissions
         (parish_id, parish_name_text, parish_address_text, title, description, category, audience_tags,
          start_datetime, end_datetime, is_recurring, recurrence_rule, submitted_by_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      b.parish_id || null,
      b.parish_name_text || null,
      b.parish_address_text || null,
      b.title,
      b.description || null,
      b.category,
      JSON.stringify(b.audience_tags || []),
      b.start_datetime,
      b.end_datetime || null,
      b.is_recurring ? 1 : 0,
      b.recurrence_rule || null,
      b.submitted_by_email
    );

  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

// Admin: list + moderate submissions.
router.get('/', requireAdmin, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT s.*, p.name AS parish_name
    FROM submissions s LEFT JOIN parishes p ON p.id = s.parish_id
    WHERE 1 = 1
  `;
  const params = [];
  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY s.created_at DESC';
  res.json(db.prepare(sql).all(...params).map(serializeSubmission));
});

router.post('/:id/approve', requireAdmin, (req, res) => {
  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (submission.status !== 'pending') return res.status(409).json({ error: `Submission already ${submission.status}` });

  let parishId = submission.parish_id;
  if (!parishId) {
    if (!req.body.diocese_id) {
      return res.status(400).json({ error: 'diocese_id is required to create a new parish from this submission' });
    }
    const parishResult = db
      .prepare('INSERT INTO parishes (name, diocese_id, address) VALUES (?, ?, ?)')
      .run(submission.parish_name_text, req.body.diocese_id, submission.parish_address_text || null);
    parishId = parishResult.lastInsertRowid;
  }

  const eventResult = db
    .prepare(
      `INSERT INTO events (parish_id, title, description, category, audience_tags, start_datetime, end_datetime, is_recurring, recurrence_rule, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .run(
      parishId,
      submission.title,
      submission.description,
      submission.category,
      submission.audience_tags,
      submission.start_datetime,
      submission.end_datetime,
      submission.is_recurring,
      submission.recurrence_rule
    );

  db.prepare("UPDATE submissions SET status = 'approved', admin_note = ? WHERE id = ?").run(
    req.body.admin_note || null,
    req.params.id
  );

  res.json({
    ok: true,
    event: serializeEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(eventResult.lastInsertRowid)),
  });
});

router.post('/:id/reject', requireAdmin, (req, res) => {
  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (submission.status !== 'pending') return res.status(409).json({ error: `Submission already ${submission.status}` });

  db.prepare("UPDATE submissions SET status = 'rejected', admin_note = ? WHERE id = ?").run(
    req.body.admin_note || null,
    req.params.id
  );
  res.json({ ok: true });
});

module.exports = router;
