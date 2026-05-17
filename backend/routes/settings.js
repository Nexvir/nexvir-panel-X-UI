// routes/settings.js
const router = require('express').Router();
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

// PUT /api/settings
router.put('/', (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const update = db.transaction((data) => {
    for (const [k, v] of Object.entries(data)) upsert.run(k, String(v));
  });
  update(req.body);
  db.prepare("INSERT INTO logs (level, msg) VALUES ('INFO', ?)").run('تنظیمات به‌روز شد');
  res.json({ success: true });
});

module.exports = router;
