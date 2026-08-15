const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');
const { serializeEvent, serializeParish } = require('../lib/serialize');

const router = express.Router();

router.get('/', (req, res) => {
  const { state } = req.query;
  let sql = 'SELECT * FROM dioceses';
  const params = [];
  if (state) {
    sql += ' WHERE state = ?';
    params.push(state);
  }
  sql += ' ORDER BY name ASC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const diocese = db.prepare('SELECT * FROM dioceses WHERE id = ?').get(req.params.id);
  if (!diocese) return res.status(404).json({ error: 'Diocese not found' });
  res.json(diocese);
});

// All upcoming, active events across every parish in this diocese, sorted by date.
router.get('/:id/events', (req, res) => {
  const diocese = db.prepare('SELECT * FROM dioceses WHERE id = ?').get(req.params.id);
  if (!diocese) return res.status(404).json({ error: 'Diocese not found' });

  const { parish_id } = req.query;
  let sql = `
    SELECT e.*, p.name AS parish_name, p.address AS parish_address
    FROM events e
    JOIN parishes p ON p.id = e.parish_id
    WHERE p.diocese_id = ? AND e.is_active = 1 AND e.start_datetime >= datetime('now', '-1 hour')
  `;
  const params = [req.params.id];
  if (parish_id) {
    sql += ' AND p.id = ?';
    params.push(parish_id);
  }
  sql += ' ORDER BY e.start_datetime ASC';
  const events = db.prepare(sql).all(...params).map(serializeEvent);
  res.json(events);
});

router.get('/:id/parishes', (req, res) => {
  const parishes = db
    .prepare('SELECT * FROM parishes WHERE diocese_id = ? ORDER BY name ASC')
    .all(req.params.id)
    .map(serializeParish);
  res.json(parishes);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, state, website } = req.body;
  if (!name || !state) return res.status(400).json({ error: 'name and state are required' });
  const result = db
    .prepare('INSERT INTO dioceses (name, state, website) VALUES (?, ?, ?)')
    .run(name, state, website || null);
  res.status(201).json(db.prepare('SELECT * FROM dioceses WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM dioceses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Diocese not found' });
  const { name, state, website } = req.body;
  db.prepare('UPDATE dioceses SET name = ?, state = ?, website = ? WHERE id = ?').run(
    name ?? existing.name,
    state ?? existing.state,
    website ?? existing.website,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM dioceses WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM dioceses WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Diocese not found' });
  res.status(204).end();
});

module.exports = router;
