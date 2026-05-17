// routes/logs.js
const router = require('express').Router();
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/logs
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(db.prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT ?').all(limit));
});

// DELETE /api/logs  — clear all
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM logs').run();
  db.prepare("INSERT INTO logs (level, msg) VALUES ('INFO', ?)").run('لاگ‌ها پاک شدند');
  res.json({ success: true });
});

module.exports = router;

// ──────────────────────────────────────────────────
// routes/settings.js  (export separately below)
// ──────────────────────────────────────────────────
