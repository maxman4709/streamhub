const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

function serialize(row) {
  return { id: row.id, name: row.name, photo: row.photo, bio: row.bio, gender: row.gender };
}

const GENDERS = ['male', 'female'];

router.get('/', async (req, res) => {
  try {
    const { gender } = req.query;
    const { rows } = gender
      ? await db.query('SELECT * FROM actors WHERE gender = $1 ORDER BY name', [gender])
      : await db.query('SELECT * FROM actors ORDER BY name');
    res.json(rows.map(serialize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM actors WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Actor not found' });
    res.json(serialize(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, photo, bio, gender } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    if (gender && !GENDERS.includes(gender)) return res.status(400).json({ error: 'gender must be male or female' });

    const { rows } = await db.query(
      'INSERT INTO actors (name, photo, bio, gender) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), photo || null, bio || null, gender || null]
    );
    res.status(201).json(serialize(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An actor with this name already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: existing } = await db.query('SELECT id FROM actors WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Actor not found' });

    const { name, photo, bio, gender } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    if (gender && !GENDERS.includes(gender)) return res.status(400).json({ error: 'gender must be male or female' });

    const { rows } = await db.query(
      'UPDATE actors SET name = $1, photo = $2, bio = $3, gender = $4 WHERE id = $5 RETURNING *',
      [name.trim(), photo || null, bio || null, gender || null, req.params.id]
    );
    res.json(serialize(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM actors WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Actor not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function findOrCreateByName(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { rows } = await db.query('SELECT id FROM actors WHERE LOWER(name) = LOWER($1)', [trimmed]);
  if (rows.length) return rows[0].id;
  const result = await db.query('INSERT INTO actors (name) VALUES ($1) RETURNING id', [trimmed]);
  return result.rows[0].id;
}

module.exports = router;
module.exports.findOrCreateByName = findOrCreateByName;
