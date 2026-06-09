const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS creators (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      verified INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS actors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      photo TEXT,
      bio TEXT,
      gender TEXT
    );
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      thumbnail TEXT,
      description TEXT,
      duration TEXT,
      creator_id INTEGER REFERENCES creators(id),
      category_id INTEGER REFERENCES categories(id),
      tags TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS video_actors (
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      actor_id INTEGER NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
      PRIMARY KEY (video_id, actor_id)
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) AS c FROM creators');
  if (Number(rows[0].c) === 0) {
    const c1 = (await pool.query("INSERT INTO creators (name, avatar, verified) VALUES ('Northern Lights', 'https://i.pravatar.cc/150?img=1', 1) RETURNING id")).rows[0].id;
    const c2 = (await pool.query("INSERT INTO creators (name, avatar, verified) VALUES ('Wanderlust Studio', 'https://i.pravatar.cc/150?img=2', 1) RETURNING id")).rows[0].id;
    const c3 = (await pool.query("INSERT INTO creators (name, avatar, verified) VALUES ('Late Night Talks', 'https://i.pravatar.cc/150?img=3', 0) RETURNING id")).rows[0].id;

    const t1 = (await pool.query("INSERT INTO categories (name) VALUES ('Travel') RETURNING id")).rows[0].id;
    const t2 = (await pool.query("INSERT INTO categories (name) VALUES ('Documentary') RETURNING id")).rows[0].id;
    const t3 = (await pool.query("INSERT INTO categories (name) VALUES ('Talk Show') RETURNING id")).rows[0].id;
    await pool.query("INSERT INTO categories (name) VALUES ('Drama')");
    await pool.query("INSERT INTO categories (name) VALUES ('Comedy')");
    await pool.query("INSERT INTO categories (name) VALUES ('Sci-Fi')");

    const a1 = (await pool.query("INSERT INTO actors (name, photo, bio, gender) VALUES ('Alex Morgan', 'https://i.pravatar.cc/300?img=12', 'Documentary host and travel narrator known for award-winning nature series.', 'male') RETURNING id")).rows[0].id;
    const a2 = (await pool.query("INSERT INTO actors (name, photo, bio, gender) VALUES ('Jordan Blake', 'https://i.pravatar.cc/300?img=33', 'Producer and on-screen talent specializing in behind-the-scenes features.', 'male') RETURNING id")).rows[0].id;
    const a3 = (await pool.query("INSERT INTO actors (name, photo, bio, gender) VALUES ('Taylor Reed', 'https://i.pravatar.cc/300?img=47', 'Talk show host and interviewer covering culture and creative industries.', 'female') RETURNING id")).rows[0].id;
    const a4 = (await pool.query("INSERT INTO actors (name, photo, bio, gender) VALUES ('Morgan Lee', 'https://i.pravatar.cc/300?img=25', 'Cinematographer and field correspondent for outdoor and nature productions.', 'female') RETURNING id")).rows[0].id;

    const v1 = (await pool.query(
      `INSERT INTO videos (title, video_url, thumbnail, description, duration, creator_id, category_id, tags, views, likes)
       VALUES ('Sunrise Over the Fjords', 'https://www.w3schools.com/html/mov_bbb.mp4', 'https://picsum.photos/seed/fjord/640/360',
               'Timelapse journey through Norwegian fjords at dawn.', '14:28', $1, $2, 'Travel,Nature,Timelapse', 125000, 6600) RETURNING id`,
      [c1, t1]
    )).rows[0].id;
    const v2 = (await pool.query(
      `INSERT INTO videos (title, video_url, thumbnail, description, duration, creator_id, category_id, tags, views, likes)
       VALUES ('Studio Session: Behind the Scenes', 'https://www.w3schools.com/html/movie.mp4', 'https://picsum.photos/seed/studio/640/360',
               'A look inside our production process from script to screen.', '38:08', $1, $2, 'Behind the Scenes,Production,Interview', 74300, 3800) RETURNING id`,
      [c2, t2]
    )).rows[0].id;
    const v3 = (await pool.query(
      `INSERT INTO videos (title, video_url, thumbnail, description, duration, creator_id, category_id, tags, views, likes)
       VALUES ('Late Night Talk: Episode 12', 'https://www.w3schools.com/html/mov_bbb.mp4', 'https://picsum.photos/seed/latenight/640/360',
               'Conversations on creativity, craft, and culture.', '21:52', $1, $2, 'Talk Show,Interview,Culture', 56200, 2600) RETURNING id`,
      [c3, t3]
    )).rows[0].id;

    await pool.query('INSERT INTO video_actors VALUES ($1,$2)', [v1, a1]);
    await pool.query('INSERT INTO video_actors VALUES ($1,$2)', [v1, a4]);
    await pool.query('INSERT INTO video_actors VALUES ($1,$2)', [v2, a2]);
    await pool.query('INSERT INTO video_actors VALUES ($1,$2)', [v3, a3]);
  }
}

module.exports = pool;
module.exports.initDb = initDb;
