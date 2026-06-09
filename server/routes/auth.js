const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Local-tool auth: one shared admin password, random session tokens kept in
// memory. Restarting the server invalidates all sessions — that's fine here.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'streamhub-admin';
const sessions = new Set();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.add(token);
  res.json({ token });
});

router.post('/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  sessions.delete(token);
  res.status(204).end();
});

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

module.exports = router;
module.exports.requireAuth = requireAuth;
