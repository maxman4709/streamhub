const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');
const { findOrCreateByName } = require('./actors');
const { findOrCreateByName: findOrCreateCreatorByName } = require('./creators');

async function resolveCreatorId(creatorId, creatorName) {
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

async function getActorsForVideo(videoId) {
  const { rows } = await db.query(
    'SELECT a.id, a.name, a.photo FROM actors a JOIN video_actors va ON va.actor_id = a.id WHERE va.video_id = $1 ORDER BY a.name',
    [videoId]
  );
  return rows;
}

async function serializeVideo(row) {
  return {
    id: row.id,
    title: row.title,
    videoUrl: row.video_url,
    thumbnail: row.thumbnail,
    description: row.description,
    duration: row.duration,
    views: row.views,
    likes: row.likes,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    creator: row.creator_id
      ? { id: row.creator_id, name: row.creator_name, avatar: row.creator_avatar, verified: !!row.creator_verified }
      : null,
    category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    cast: await getActorsForVideo(row.id),
  };
}

async function setCast(videoId, names) {
  await db.query('DELETE FROM video_actors WHERE video_id = $1', [videoId]);
  if (!names || !names.length) return;
  for (const name of names) {
    const actorId = await findOrCreateByName(name);
    if (actorId) {
      await db.query(
        'INSERT INTO video_actors (video_id, actor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [videoId, actorId]
      );
    }
  }
}

router.get('/', async (req, res) => {
  try {
    const { tag, creator, category, actor, q } = req.query;
    let sql = SELECT_BASE;
    const where = [];
    const params = [];
    let idx = 1;

    if (tag) {
      where.push(`(',' || v.tags || ',') LIKE $${idx++}`);
      params.push(`%,${tag},%`);
    }
    if (creator) {
      where.push(`v.creator_id = $${idx++}`);
      params.push(creator);
    }
    if (category) {
      where.push(`v.category_id = $${idx++}`);
      params.push(category);
    }
    if (actor) {
      where.push(`v.id IN (SELECT video_id FROM video_actors WHERE actor_id = $${idx++})`);
      params.push(actor);
    }
    if (q) {
      where.push(`(v.title ILIKE $${idx} OR v.description ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY v.created_at DESC';

    const { rows } = await db.query(sql, params);
    const videos = await Promise.all(rows.map(serializeVideo));
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(SELECT_BASE + ' WHERE v.id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Video not found' });
    res.json(await serializeVideo(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/view', async (req, res) => {
  try {
    const { rowCount } = await db.query('UPDATE videos SET views = views + 1 WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Video not found' });
    const { rows } = await db.query(SELECT_BASE + ' WHERE v.id = $1', [req.params.id]);
    res.json(await serializeVideo(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, videoUrl, thumbnail, description, duration, creatorId, creatorName, categoryId, tags, cast } = req.body;
    if (!title || !videoUrl) return res.status(400).json({ error: 'title and videoUrl are required' });

    const creator_id = await resolveCreatorId(creatorId, creatorName);
    const { rows } = await db.query(
      `INSERT INTO videos (title, video_url, thumbnail, description, duration, creator_id, category_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [title, videoUrl, thumbnail || null, description || null, duration || null, creator_id, categoryId || null, tags || '']
    );
    const newId = rows[0].id;
    await setCast(newId, cast);

    const { rows: vrows } = await db.query(SELECT_BASE + ' WHERE v.id = $1', [newId]);
    res.status(201).json(await serializeVideo(vrows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: existing } = await db.query('SELECT id FROM videos WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Video not found' });

    const { title, videoUrl, thumbnail, description, duration, creatorId, creatorName, categoryId, tags, cast } = req.body;
    const creator_id = await resolveCreatorId(creatorId, creatorName);
    await db.query(
      `UPDATE videos SET title=$1, video_url=$2, thumbnail=$3, description=$4, duration=$5,
       creator_id=$6, category_id=$7, tags=$8 WHERE id=$9`,
      [title, videoUrl, thumbnail || null, description || null, duration || null, creator_id, categoryId || null, tags || '', req.params.id]
    );
    await setCast(req.params.id, cast);

    const { rows } = await db.query(SELECT_BASE + ' WHERE v.id = $1', [req.params.id]);
    res.json(await serializeVideo(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM videos WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Video not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
