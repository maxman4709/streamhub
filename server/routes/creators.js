const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

function serialize(row) {
  return { id: row.id, name: row.name, avatar: row.avatar, verified: !!row.verified };
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM creators ORDER BY name');
    res.json(rows.map(serialize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, avatar, verified } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rows } = await db.query(
      'INSERT INTO creators (name, avatar, verified) VALUES ($1, $2, $3) RETURNING *',
      [name, avatar || null, verified ? 1 : 0]
    );
    res.status(201).json(serialize(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: existing } = await db.query('SELECT id FROM creators WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Creator not found' });

    const { name, avatar, verified } = req.body;
    const { rows } = await db.query(
      'UPDATE creators SET name = $1, avatar = $2, verified = $3 WHERE id = $4 RETURNING *',
      [name, avatar || null, verified ? 1 : 0, req.params.id]
    );
    res.json(serialize(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM creators WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Creator not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function findOrCreateByName(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { rows } = await db.query('SELECT id FROM creators WHERE LOWER(name) = LOWER($1)', [trimmed]);
  if (rows.length) return rows[0].id;
  const result = await db.query('INSERT INTO creators (name) VALUES ($1) RETURNING id', [trimmed]);
  return result.rows[0].id;
}

module.exports = router;
module.exports.findOrCreateByName = findOrCreateByName;
