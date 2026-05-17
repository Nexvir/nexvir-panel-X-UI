// routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { signToken, authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است' });

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password))
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });

  const token = signToken({ id: admin.id, username: admin.username });
  db.prepare("INSERT INTO logs (level, msg) VALUES ('INFO', ?)").run(`ورود ادمین: ${username}`);
  res.json({ token, username: admin.username });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req, res) => {
  const { current, newPass } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(current, admin.password))
    return res.status(400).json({ error: 'رمز فعلی اشتباه است' });

  const hash = bcrypt.hashSync(newPass, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hash, admin.id);
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ id: req.admin.id, username: req.admin.username });
});

module.exports = router;
