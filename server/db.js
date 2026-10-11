const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'transpago.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'client')),
      name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      modality TEXT NOT NULL CHECK(modality IN ('diario', 'semanal')),
      price REAL NOT NULL,
      start_date TEXT NOT NULL,
      active_days TEXT DEFAULT '1,2,3,4,5',
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      method TEXT DEFAULT 'Efectivo',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed or update owner account with requested credentials
  const defaultPasswordHash = bcrypt.hashSync('davidFF06', 10);
  const owner = db.prepare("SELECT * FROM users WHERE role = 'owner'").get();
  if (!owner) {
    db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone)
      VALUES (?, ?, 'owner', ?, ?)
    `).run('admin', defaultPasswordHash, 'David (Administrador)', '63336030');
    console.log('[DB] Cuenta de administrador creada: usuario "admin" / clave "davidFF06"');
  } else {
    // Ensure admin has the requested username, password, and phone
    db.prepare(`
      UPDATE users 
      SET username = 'admin', password_hash = ?, phone = '63336030'
      WHERE id = ?
    `).run(defaultPasswordHash, owner.id);
    console.log('[DB] Credenciales de admin actualizadas: usuario "admin" / clave "davidFF06"');
  }

  // Seed default settings if not exists
  const defaultSettings = [
    { key: 'owner_name', value: 'Conductor / Propietario' },
    { key: 'owner_phone', value: '63336030' },
    { key: 'yappy', value: '63336030' },
    { key: 'payment_notes', value: 'Puedes pagar en Efectivo directamente al conductor o por Yappy al 63336030.' },
  ];

  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  for (const s of defaultSettings) {
    upsertSetting.run(s.key, s.value);
  }
}

initDb();

module.exports = db;
