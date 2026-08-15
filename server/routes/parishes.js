const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');
const { serializeEvent, serializeParish } = require('../lib/serialize');
const { distanceMiles } = require('../lib/geo');

const router = express.Router();

router.get('/', (req, res) => {
  const { diocese_id, state, q, lat, lng, radius_miles } = req.query;
  let sql = `
    SELECT p.*, d.name AS diocese_name, d.state AS diocese_state
    FROM parishes p JOIN dioceses d ON d.id = p.diocese_id
    WHERE 1 = 1
  `;
  const params = [];
  if (diocese_id) {
    sql += ' AND p.diocese_id = ?';
    params.push(diocese_id);
  }
  if (state) {
    sql += ' AND d.state = ?';
    params.push(state);
  }
  if (q) {
    sql += ' AND (p.name LIKE ? OR p.address LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY p.name ASC';

  let parishes = db.prepare(sql).all(...params).map(serializeParish);

  if (lat && lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radius = radius_miles ? Number(radius_miles) : 50;
    parishes = parishes
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({ ...p, distance_miles: distanceMiles(latNum, lngNum, p.lat, p.lng) }))
      .filter((p) => p.distance_miles <= radius)
      .sort((a, b) => a.distance_miles - b.distance_miles);
  }

  res.json(parishes);
});

router.get('/:id', (req, res) => {
  const parish = db
    .prepare(
      `SELECT p.*, d.name AS diocese_name, d.state AS diocese_state
       FROM parishes p JOIN dioceses d ON d.id = p.diocese_id
       WHERE p.id = ?`
    )
    .get(req.params.id);
  if (!parish) return res.status(404).json({ error: 'Parish not found' });
  res.json(serializeParish(parish));
});

router.get('/:id/events', (req, res) => {
  const parish = db.prepare('SELECT * FROM parishes WHERE id = ?').get(req.params.id);
  if (!parish) return res.status(404).json({ error: 'Parish not found' });
  const { include_past } = req.query;
  let sql = 'SELECT * FROM events WHERE parish_id = ? AND is_active = 1';
  if (!include_past) sql += " AND start_datetime >= datetime('now', '-1 hour')";
  sql += ' ORDER BY start_datetime ASC';
  res.json(db.prepare(sql).all(req.params.id).map(serializeEvent));
});

router.post('/', requireAdmin, (req, res) => {
  const { name, diocese_id, address, lat, lng, website, phone, is_verified } = req.body;
  if (!name || !diocese_id) return res.status(400).json({ error: 'name and diocese_id are required' });
  const result = db
    .prepare(
      `INSERT INTO parishes (name, diocese_id, address, lat, lng, website, phone, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, diocese_id, address || null, lat ?? null, lng ?? null, website || null, phone || null, is_verified ? 1 : 0);
  res.status(201).json(serializeParish(db.prepare('SELECT * FROM parishes WHERE id = ?').get(result.lastInsertRowid)));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM parishes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Parish not found' });
  const fields = ['name', 'diocese_id', 'address', 'lat', 'lng', 'website', 'phone', 'is_verified'];
  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE parishes SET name=?, diocese_id=?, address=?, lat=?, lng=?, website=?, phone=?, is_verified=? WHERE id=?`
  ).run(
    merged.name,
    merged.diocese_id,
    merged.address,
    merged.lat,
    merged.lng,
    merged.website,
    merged.phone,
    merged.is_verified ? 1 : 0,
    req.params.id
  );
  res.json(serializeParish(db.prepare('SELECT * FROM parishes WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM parishes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Parish not found' });
  res.status(204).end();
});

module.exports = router;
