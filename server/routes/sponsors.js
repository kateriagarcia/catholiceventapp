const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Public: active sponsors, e.g. for the homepage banner / event sidebar ad slot.
router.get('/', (req, res) => {
  const { tier } = req.query;
  let sql = "SELECT id, business_name, category, website, logo_url, tier FROM sponsors WHERE status = 'active' AND (active_until IS NULL OR active_until >= date('now'))";
  const params = [];
  if (tier) {
    sql += ' AND tier = ?';
    params.push(tier);
  }
  sql += " ORDER BY CASE tier WHEN 'featured' THEN 0 ELSE 1 END, business_name ASC";
  res.json(db.prepare(sql).all(...params));
});

router.get('/featured', (req, res) => {
  const sponsor = db
    .prepare(
      `SELECT id, business_name, category, website, logo_url, tier FROM sponsors
       WHERE status = 'active' AND tier = 'featured' AND (active_until IS NULL OR active_until >= date('now'))
       ORDER BY RANDOM() LIMIT 1`
    )
    .get();
  res.json(sponsor || null);
});

// Admin: full sponsor management.
router.get('/admin', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM sponsors ORDER BY created_at DESC').all());
});

router.post('/', requireAdmin, (req, res) => {
  const { business_name, category, website, logo_url, tier, active_until, contact_email, status } = req.body;
  if (!business_name) return res.status(400).json({ error: 'business_name is required' });
  const result = db
    .prepare(
      `INSERT INTO sponsors (business_name, category, website, logo_url, tier, active_until, contact_email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      business_name,
      category || null,
      website || null,
      logo_url || null,
      tier || 'standard',
      active_until || null,
      contact_email || null,
      status || 'active'
    );
  res.status(201).json(db.prepare('SELECT * FROM sponsors WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM sponsors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Sponsor not found' });
  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE sponsors SET business_name=?, category=?, website=?, logo_url=?, tier=?, active_until=?, contact_email=?, status=? WHERE id=?`
  ).run(
    merged.business_name,
    merged.category,
    merged.website,
    merged.logo_url,
    merged.tier,
    merged.active_until,
    merged.contact_email,
    merged.status,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM sponsors WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM sponsors WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Sponsor not found' });
  res.status(204).end();
});

module.exports = router;
