// server.js — Nexvir Panel Backend
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { initDB } = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production')
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Static frontend ────────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/inbounds', require('./routes/inbounds'));
app.use('/api/servers',  require('./routes/servers'));
app.use('/api/logs',     require('./routes/logs'));
app.use('/api/settings', require('./routes/settings'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── Subscription endpoint (public) ────────────────────────
// Returns user config links at /sub/:uuid
const { db } = require('./db/database');
app.get('/sub/:uuid', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(req.params.uuid);
  if (!user || user.status === 'expired') return res.status(404).send('Not found');

  const domain = db.prepare("SELECT value FROM settings WHERE key='domain'").get()?.value || 'your.domain.com';
  const vmessConfig = {
    add: domain, aid: '0', host: domain, id: user.uuid,
    net: 'ws', path: '/nexvir', port: '443',
    ps: `Nexvir-${user.name}`, tls: 'tls', type: 'none', v: '2'
  };
  const link = `vmess://${Buffer.from(JSON.stringify(vmessConfig)).toString('base64')}`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(link);
});

// ── SPA fallback ───────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'خطای داخلی سرور' });
});

// ── Start ──────────────────────────────────────────────────
initDB();
app.listen(PORT, () => {
  console.log(`\n🚀 Nexvir Panel running on http://localhost:${PORT}`);
  console.log(`📦 API: http://localhost:${PORT}/api`);
  console.log(`🔐 Default login: admin / admin123\n`);
});
