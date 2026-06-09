const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');
const { findOrCreateByName } = require('./actors');
const { findOrCreateByName: findOrCreateCreatorByName } = require('./creators');

function resolveCreatorId(creatorId, creatorName) {
  if (creatorId) return creatorId;
  if (creatorName && creatorName.trim()) return findOrCreateCreatorByName(creatorName);
  return null;
}

const router = express.Router();

const SELECT_BASE = `
  SELECT v.*,
         c.name AS creator_name, c.avatar AS creator_avatar, c.verified AS creator_verified,
         cat.name AS category_name
  FROM videos v
  LEFT JOIN creators c ON c.id = v.creator_id
  LEFT JOIN categories cat ON cat.id = v.category_id
`;

const getActorsForVideo = db.prepare(`
  SELECT a.id, a.name, a.photo
  FROM actors a
  JOIN video_actors va ON va.actor_id = a.id
  WHERE va.video_id = ?
  ORDER BY a.name
`);

function serializeVideo(row) {
  return {
    id: row.id,
    title: row.title,
    videoUrl: row.video_url,
    thumbnail: row.thumbnail,
    description: row.description,
    duration: row.duration,
    views: row.views,
    likes: row.likes,
    createdAt: row.created_at,
    tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    creator: row.creator_id
      ? { id: row.creator_id, name: row.creator_name, avatar: row.creator_avatar, verified: !!row.creator_verified }
      : null,
    category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    cast: getActorsForVideo.all(row.id),
  };
}

// links a video to a list of actor names — finds existing actors by name or
// creates new ones on the fly, then replaces the video's cast list
function setCast(videoId, names) {
  db.prepare('DELETE FROM video_actors WHERE video_id = ?').run(videoId);
  if (!names || !names.length) return;

  const link = db.prepare('INSERT OR IGNORE INTO video_actors (video_id, actor_id) VALUES (?, ?)');
  for (const name of names) {
    const actorId = findOrCreateByName(name);
    if (actorId) link.run(videoId, actorId);
  }
}

// list + filter by tag/creator/category/actor/search
router.get('/', (req, res) => {
  const { tag, creator, category, actor, q } = req.query;
  let sql = SELECT_BASE;
  const where = [];
  const params = [];

  if (tag) {
    where.push("(',' || v.tags || ',') LIKE ?");
    params.push(`%,${tag},%`);
  }
  if (creator) {
    where.push('v.creator_id = ?');
    params.push(creator);
  }
  if (category) {
    where.push('v.category_id = ?');
    params.push(category);
  }
  if (actor) {
    where.push('v.id IN (SELECT video_id FROM video_actors WHERE actor_id = ?)');
    params.push(actor);
  }
  if (q) {
    where.push('(v.title LIKE ? OR v.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY v.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeVideo));
});

router.get('/:id', (req, res) => {
  const row = db.prepare(SELECT_BASE + ' WHERE v.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Video not found' });
  res.json(serializeVideo(row));
});

// increments view count and returns the video (used when playback starts)
router.post('/:id/view', (req, res) => {
  const result = db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Video not found' });
  const row = db.prepare(SELECT_BASE + ' WHERE v.id = ?').get(req.params.id);
  res.json(serializeVideo(row));
});

router.post('/', requireAuth, (req, res) => {
  const { title, videoUrl, thumbnail, description, duration, creatorId, creatorName, categoryId, tags, cast } = req.body;
  if (!title || !videoUrl) return res.status(400).json({ error: 'title and videoUrl are required' });

  const result = db.prepare(`
    INSERT INTO videos (title, video_url, thumbnail, description, duration, creator_id, category_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, videoUrl, thumbnail || null, description || null, duration || null, resolveCreatorId(creatorId, creatorName), categoryId || null, tags || '');

  setCast(result.lastInsertRowid, cast);

  const row = db.prepare(SELECT_BASE + ' WHERE v.id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeVideo(row));
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM videos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Video not found' });

  const { title, videoUrl, thumbnail, description, duration, creatorId, creatorName, categoryId, tags, cast } = req.body;
  db.prepare(`
    UPDATE videos
    SET title = ?, video_url = ?, thumbnail = ?, description = ?, duration = ?,
        creator_id = ?, category_id = ?, tags = ?
    WHERE id = ?
  `).run(title, videoUrl, thumbnail || null, description || null, duration || null, resolveCreatorId(creatorId, creatorName), categoryId || null, tags || '', req.params.id);

  setCast(req.params.id, cast);

  const row = db.prepare(SELECT_BASE + ' WHERE v.id = ?').get(req.params.id);
  res.json(serializeVideo(row));
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Video not found' });
  res.status(204).end();
});

module.exports = router;
