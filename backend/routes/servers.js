// routes/servers.js
const router = require('express').Router();
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/servers
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM servers ORDER BY created_at DESC').all());
});

// POST /api/servers
router.post('/', (req, res) => {
  const { name, flag = '🌍', proto = 'Xray', ip = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'نام سرور الزامی است' });

  const id = 's' + Date.now();
  db.prepare('INSERT INTO servers (id, name, flag, proto, load, online, ip) VALUES (?, ?, ?, ?, 0, 1, ?)')
    .run(id, name, flag, proto, ip);
  db.prepare("INSERT INTO logs (level, msg) VALUES ('INFO', ?)").run(`سرور جدید اضافه شد: ${name}`);
  res.status(201).json(db.prepare('SELECT * FROM servers WHERE id = ?').get(id));
});

// PATCH /api/servers/:id
router.patch('/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'سرور یافت نشد' });

  const fields = ['name', 'flag', 'proto', 'load', 'online', 'ip'];
  const updates = [], vals = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'فیلدی ارسال نشد' });
  vals.push(req.params.id);
  db.prepare(`UPDATE servers SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  res.json(db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id));
});

// DELETE /api/servers/:id
router.delete('/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'سرور یافت نشد' });
  db.prepare('DELETE FROM servers WHERE id = ?').run(req.params.id);
  db.prepare("INSERT INTO logs (level, msg) VALUES ('WARN', ?)").run(`سرور حذف شد: ${s.name}`);
  res.json({ success: true });
});

module.exports = router;
