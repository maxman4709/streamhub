const express = require('express');
const cors = require('cors');

const videosRouter = require('./routes/videos');
const creatorsRouter = require('./routes/creators');
const actorsRouter = require('./routes/actors');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/videos', videosRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/actors', actorsRouter);
app.use('/api/categories', categoriesRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
