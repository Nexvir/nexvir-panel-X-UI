// routes/users.js
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// All routes require auth
router.use(authMiddleware);

// GET /api/users  — list all
router.get('/', (req, res) => {
  const { search, status } = req.query;
  let sql = 'SELECT * FROM users';
  const params = [];
  const conds = [];
  if (search) { conds.push("name LIKE ?"); params.push(`%${search}%`); }
  if (status) { conds.push("status = ?"); params.push(status); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/users/stats
router.get('/stats', (req, res) => {
  const total   = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const online  = db.prepare("SELECT COUNT(*) as c FROM users WHERE status='online'").get().c;
  const expired = db.prepare("SELECT COUNT(*) as c FROM users WHERE status='expired'").get().c;
  const traffic = db.prepare('SELECT SUM(traffic_used) as t FROM users').get().t || 0;
  res.json({ total, online, expired, traffic: Math.round(traffic * 10) / 10 });
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, proto = 'vmess', traffic_total = 50, days = 30, note = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'نام کاربری الزامی است' });

  const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ error: 'این نام کاربری قبلاً ثبت شده است' });

  const id = 'u' + Date.now();
  const uuid = uuidv4();
  db.prepare(`
    INSERT INTO users (id, name, proto, status, traffic_used, traffic_total, days, uuid, note, expires_at)
    VALUES (?, ?, ?, 'offline', 0, ?, ?, ?, ?, datetime('now', '+' || ? || ' days'))
  `).run(id, name, proto, traffic_total, days, uuid, note, days);

  db.prepare("INSERT INTO logs (level, msg) VALUES ('INFO', ?)").run(`کاربر جدید ساخته شد: ${name}`);
  res.status(201).json(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });
  res.json(user);
});

// PATCH /api/users/:id
router.patch('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const fields = ['proto', 'traffic_total', 'days', 'note'];
  const updates = [];
  const vals = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      vals.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'هیچ فیلدی برای ویرایش ارسال نشد' });
  vals.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
});

// POST /api/users/:id/toggle  — enable/disable
router.post('/:id/toggle', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const newStatus = user.status === 'online' ? 'offline' : 'online';
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, req.params.id);
  db.prepare("INSERT INTO logs (level, msg) VALUES ('INFO', ?)").run(`وضعیت ${user.name} به ${newStatus} تغییر کرد`);
  res.json({ status: newStatus });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  db.prepare("INSERT INTO logs (level, msg) VALUES ('WARN', ?)").run(`کاربر حذف شد: ${user.name}`);
  res.json({ success: true });
});

// GET /api/users/:id/config  — generate config/sub link
router.get('/:id/config', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const domain = db.prepare("SELECT value FROM settings WHERE key='domain'").get()?.value || 'your.domain.com';
  const subPath = db.prepare("SELECT value FROM settings WHERE key='sub_path'").get()?.value || '/sub';

  const vmessConfig = {
    add: domain, aid: '0', host: domain, id: user.uuid,
    net: 'ws', path: '/nexvir', port: '443',
    ps: `Nexvir-${user.name}`, tls: 'tls', type: 'none', v: '2'
  };
  const link = `vmess://${Buffer.from(JSON.stringify(vmessConfig)).toString('base64')}`;
  const sub  = `https://${domain}${subPath}/${user.uuid}`;

  res.json({ link, sub, uuid: user.uuid, proto: user.proto });
});

module.exports = router;
