const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    verified INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS actors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    photo TEXT,
    bio TEXT,
    gender TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS video_actors (
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, actor_id)
  );
`);

// migration: older db files won't have category_id yet
const videoCols = db.prepare("PRAGMA table_info(videos)").all().map((c) => c.name);
if (!videoCols.includes('category_id')) {
  db.exec('ALTER TABLE videos ADD COLUMN category_id INTEGER REFERENCES categories(id)');
}

const actorCols = db.prepare("PRAGMA table_info(actors)").all().map((c) => c.name);
if (!actorCols.includes('gender')) {
  db.exec('ALTER TABLE actors ADD COLUMN gender TEXT');
}

// backfill gender on actors seeded before the gender column existed
const setGender = db.prepare('UPDATE actors SET gender = ? WHERE name = ? AND gender IS NULL');
setGender.run('male', 'Alex Morgan');
setGender.run('male', 'Jordan Blake');
setGender.run('female', 'Taylor Reed');
setGender.run('female', 'Morgan Lee');

// seed sample data on first run
const count = db.prepare('SELECT COUNT(*) AS c FROM creators').get().c;
if (count === 0) {
  const insertCreator = db.prepare('INSERT INTO creators (name, avatar, verified) VALUES (?, ?, ?)');
  const c1 = insertCreator.run('Northern Lights', 'https://i.pravatar.cc/150?img=1', 1).lastInsertRowid;
  const c2 = insertCreator.run('Wanderlust Studio', 'https://i.pravatar.cc/150?img=2', 1).lastInsertRowid;
  const c3 = insertCreator.run('Late Night Talks', 'https://i.pravatar.cc/150?img=3', 0).lastInsertRowid;

  const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const catTravel = insertCategory.run('Travel').lastInsertRowid;
  const catDocumentary = insertCategory.run('Documentary').lastInsertRowid;
  const catTalkShow = insertCategory.run('Talk Show').lastInsertRowid;
  insertCategory.run('Drama');
  insertCategory.run('Comedy');
  insertCategory.run('Sci-Fi');

  const insertActor = db.prepare('INSERT INTO actors (name, photo, bio, gender) VALUES (?, ?, ?, ?)');
  const a1 = insertActor.run('Alex Morgan', 'https://i.pravatar.cc/300?img=12', 'Documentary host and travel narrator known for award-winning nature series.', 'male').lastInsertRowid;
  const a2 = insertActor.run('Jordan Blake', 'https://i.pravatar.cc/300?img=33', 'Producer and on-screen talent specializing in behind-the-scenes features.', 'male').lastInsertRowid;
  const a3 = insertActor.run('Taylor Reed', 'https://i.pravatar.cc/300?img=47', 'Talk show host and interviewer covering culture and creative industries.', 'female').lastInsertRowid;
  const a4 = insertActor.run('Morgan Lee', 'https://i.pravatar.cc/300?img=25', 'Cinematographer and field correspondent for outdoor and nature productions.', 'female').lastInsertRowid;

  const insertVideo = db.prepare(`
    INSERT INTO videos (title, video_url, thumbnail, description, duration, creator_id, category_id, tags, views, likes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const v1 = insertVideo.run(
    'Sunrise Over the Fjords',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://picsum.photos/seed/fjord/640/360',
    'Timelapse journey through Norwegian fjords at dawn.',
    '14:28',
    c1,
    catTravel,
    'Travel,Nature,Timelapse',
    125000,
    6600
  ).lastInsertRowid;
  const v2 = insertVideo.run(
    'Studio Session: Behind the Scenes',
    'https://www.w3schools.com/html/movie.mp4',
    'https://picsum.photos/seed/studio/640/360',
    'A look inside our production process from script to screen.',
    '38:08',
    c2,
    catDocumentary,
    'Behind the Scenes,Production,Interview',
    74300,
    3800
  ).lastInsertRowid;
  const v3 = insertVideo.run(
    'Late Night Talk: Episode 12',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://picsum.photos/seed/latenight/640/360',
    'Conversations on creativity, craft, and culture.',
    '21:52',
    c3,
    catTalkShow,
    'Talk Show,Interview,Culture',
    56200,
    2600
  ).lastInsertRowid;

  const linkActor = db.prepare('INSERT INTO video_actors (video_id, actor_id) VALUES (?, ?)');
  linkActor.run(v1, a1);
  linkActor.run(v1, a4);
  linkActor.run(v2, a2);
  linkActor.run(v3, a3);
}

module.exports = db;
