const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

function serialize(row) {
  return { id: row.id, name: row.name };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows.map(serialize));
});

router.post('/', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(serialize(row));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    throw err;
  }
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json(serialize(row));
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.status(204).end();
});

module.exports = router;
