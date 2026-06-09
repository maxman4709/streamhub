const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

function serialize(row) {
  return { id: row.id, name: row.name, avatar: row.avatar, verified: !!row.verified };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM creators ORDER BY name').all();
  res.json(rows.map(serialize));
});

router.post('/', requireAuth, (req, res) => {
  const { name, avatar, verified } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare('INSERT INTO creators (name, avatar, verified) VALUES (?, ?, ?)')
    .run(name, avatar || null, verified ? 1 : 0);

  const row = db.prepare('SELECT * FROM creators WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serialize(row));
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM creators WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Creator not found' });

  const { name, avatar, verified } = req.body;
  db.prepare('UPDATE creators SET name = ?, avatar = ?, verified = ? WHERE id = ?')
    .run(name, avatar || null, verified ? 1 : 0, req.params.id);

  const row = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
  res.json(serialize(row));
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM creators WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Creator not found' });
  res.status(204).end();
});

// finds an existing channel by case-insensitive name, or creates one — lets the
// upload form take a typed channel name without forcing a dropdown pick first
function findOrCreateByName(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = db.prepare('SELECT id FROM creators WHERE name = ? COLLATE NOCASE').get(trimmed);
  if (existing) return existing.id;
  return db.prepare('INSERT INTO creators (name) VALUES (?)').run(trimmed).lastInsertRowid;
}

module.exports = router;
module.exports.findOrCreateByName = findOrCreateByName;
