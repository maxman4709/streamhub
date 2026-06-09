const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

function serialize(row) {
  return { id: row.id, name: row.name, photo: row.photo, bio: row.bio, gender: row.gender };
}

router.get('/', (req, res) => {
  const { gender } = req.query;
  const rows = gender
    ? db.prepare('SELECT * FROM actors WHERE gender = ? ORDER BY name').all(gender)
    : db.prepare('SELECT * FROM actors ORDER BY name').all();
  res.json(rows.map(serialize));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM actors WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Actor not found' });
  res.json(serialize(row));
});

const GENDERS = ['male', 'female'];

router.post('/', requireAuth, (req, res) => {
  const { name, photo, bio, gender } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (gender && !GENDERS.includes(gender)) return res.status(400).json({ error: 'gender must be male or female' });

  try {
    const result = db.prepare('INSERT INTO actors (name, photo, bio, gender) VALUES (?, ?, ?, ?)')
      .run(name.trim(), photo || null, bio || null, gender || null);
    const row = db.prepare('SELECT * FROM actors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(serialize(row));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An actor with this name already exists' });
    }
    throw err;
  }
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM actors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Actor not found' });

  const { name, photo, bio, gender } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (gender && !GENDERS.includes(gender)) return res.status(400).json({ error: 'gender must be male or female' });

  db.prepare('UPDATE actors SET name = ?, photo = ?, bio = ?, gender = ? WHERE id = ?')
    .run(name.trim(), photo || null, bio || null, gender || null, req.params.id);

  const row = db.prepare('SELECT * FROM actors WHERE id = ?').get(req.params.id);
  res.json(serialize(row));
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM actors WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Actor not found' });
  res.status(204).end();
});

// finds an existing actor by case-insensitive name, or creates one — used when
// the upload form gets a cast name that doesn't exist yet
function findOrCreateByName(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = db.prepare('SELECT id FROM actors WHERE name = ? COLLATE NOCASE').get(trimmed);
  if (existing) return existing.id;
  return db.prepare('INSERT INTO actors (name) VALUES (?)').run(trimmed).lastInsertRowid;
}

module.exports = router;
module.exports.findOrCreateByName = findOrCreateByName;
