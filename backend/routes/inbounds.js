// routes/inbounds.js
const router = require('express').Router();
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/inbounds
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM inbounds ORDER BY created_at DESC').all());
});

// POST /api/inbounds
router.post('/', (req, res) => {
  const { name, proto = 'vmess', port = 443, transport = 'ws', tls = 'tls', addr = 'your.domain.com' } = req.body;
  if (!name) return res.status(400).json({ error: 'نام اینباند الزامی است' });

  const existing = db.prepare('SELECT id FROM inbounds WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ error: 'این نام اینباند قبلاً ثبت شده است' });

  const id = 'ib' + Date.now();
  db.prepare('INSERT INTO inbounds (id, name, proto, port, transport, tls, addr) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, proto, port, transport, tls, addr);
  db.prepare("INSERT INTO logs (level, msg) VALUES ('INFO', ?)").run(`اینباند جدید: ${name}`);
  res.status(201).json(db.prepare('SELECT * FROM inbounds WHERE id = ?').get(id));
});

// DELETE /api/inbounds/:id
router.delete('/:id', (req, res) => {
  const ib = db.prepare('SELECT * FROM inbounds WHERE id = ?').get(req.params.id);
  if (!ib) return res.status(404).json({ error: 'اینباند یافت نشد' });
  db.prepare('DELETE FROM inbounds WHERE id = ?').run(req.params.id);
  db.prepare("INSERT INTO logs (level, msg) VALUES ('WARN', ?)").run(`اینباند حذف شد: ${ib.name}`);
  res.json({ success: true });
});

module.exports = router;
