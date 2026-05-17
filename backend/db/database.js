// db/database.js
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'nexvir.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      proto TEXT NOT NULL DEFAULT 'vmess',
      status TEXT NOT NULL DEFAULT 'offline',
      traffic_used REAL NOT NULL DEFAULT 0,
      traffic_total REAL NOT NULL DEFAULT 50,
      days INTEGER NOT NULL DEFAULT 30,
      note TEXT DEFAULT '',
      uuid TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS inbounds (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      proto TEXT NOT NULL DEFAULT 'vmess',
      port INTEGER NOT NULL DEFAULT 443,
      transport TEXT NOT NULL DEFAULT 'ws',
      tls TEXT NOT NULL DEFAULT 'tls',
      addr TEXT NOT NULL DEFAULT 'your.domain.com',
      user_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flag TEXT NOT NULL DEFAULT '🌍',
      proto TEXT NOT NULL DEFAULT 'Xray',
      load INTEGER NOT NULL DEFAULT 0,
      online INTEGER NOT NULL DEFAULT 1,
      ip TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'INFO',
      msg TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default admin if not exists
  const adminExists = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hash);
    console.log('✅ Default admin created: admin / admin123');
  }

  // Seed default settings
  const settingsData = [
    ['domain', 'your.domain.com'],
    ['panel_port', '3000'],
    ['sub_path', '/sub'],
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of settingsData) insertSetting.run(k, v);

  // Seed sample data if empty
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    const { v4: uuidv4 } = require('uuid');
    const sampleUsers = [
      { id: 'u1', name: 'user_alpha', proto: 'vmess', status: 'online', traffic_used: 12.5, traffic_total: 50, days: 25 },
      { id: 'u2', name: 'user_beta', proto: 'vless', status: 'offline', traffic_used: 48.2, traffic_total: 100, days: 8 },
      { id: 'u3', name: 'user_gamma', proto: 'trojan', status: 'expired', traffic_used: 30, traffic_total: 30, days: 0 },
      { id: 'u4', name: 'user_delta', proto: 'vmess', status: 'online', traffic_used: 5, traffic_total: 20, days: 12 },
    ];
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, proto, status, traffic_used, traffic_total, days, uuid, expires_at)
      VALUES (@id, @name, @proto, @status, @traffic_used, @traffic_total, @days, @uuid, datetime('now', '+' || @days || ' days'))
    `);
    for (const u of sampleUsers) insertUser.run({ ...u, uuid: uuidv4() });

    const sampleServers = [
      { id: 's1', name: 'Frankfurt DE', flag: '🇩🇪', proto: 'Xray 1.8.4', load: 42, online: 1, ip: '185.123.45.67' },
      { id: 's2', name: 'Amsterdam NL', flag: '🇳🇱', proto: 'Xray 1.8.4', load: 71, online: 1, ip: '194.56.78.90' },
      { id: 's3', name: 'Helsinki FI', flag: '🇫🇮', proto: 'Sing-Box', load: 28, online: 1, ip: '37.27.12.34' },
      { id: 's4', name: 'Paris FR', flag: '🇫🇷', proto: 'Xray 1.8.3', load: 55, online: 0, ip: '51.77.200.11' },
    ];
    const insertServer = db.prepare('INSERT OR IGNORE INTO servers (id, name, flag, proto, load, online, ip) VALUES (@id, @name, @flag, @proto, @load, @online, @ip)');
    for (const s of sampleServers) insertServer.run(s);

    const sampleInbounds = [
      { id: 'ib1', name: 'Main-WS-TLS', proto: 'vmess', port: 443, transport: 'ws', tls: 'tls', addr: 'your.domain.com', user_count: 12 },
      { id: 'ib2', name: 'VLESS-XTLS', proto: 'vless', port: 8443, transport: 'tcp', tls: 'xtls', addr: 'your.domain.com', user_count: 7 },
      { id: 'ib3', name: 'Trojan-gRPC', proto: 'trojan', port: 443, transport: 'grpc', tls: 'tls', addr: 'your.domain.com', user_count: 4 },
    ];
    const insertInbound = db.prepare('INSERT OR IGNORE INTO inbounds (id, name, proto, port, transport, tls, addr, user_count) VALUES (@id, @name, @proto, @port, @transport, @tls, @addr, @user_count)');
    for (const ib of sampleInbounds) insertInbound.run(ib);
  }

  console.log('✅ Database initialized');
}

module.exports = { db, initDB };
