const bcrypt = require('bcryptjs');
const db = require('./db');
const { formatDateISO } = require('./debtEngine');

function seed() {
  console.log('[Seed] Poblando datos de prueba demostrativos...');

  const today = new Date();

  function getDateDaysAgo(days) {
    const d = new Date(today.getTime());
    d.setDate(d.getDate() - days);
    return formatDateISO(d);
  }

  const clientsData = [
    {
      name: 'Carlos Rodríguez',
      phone: '3001112233',
      username: 'carlos300',
      password: '123',
      modality: 'diario',
      price: 5000,
      start_date: getDateDaysAgo(2),
      active_days: '1,2,3,4,5',
      notes: 'Ruta Calle 72 - Centro',
      payments: [],
    },
    {
      name: 'Ana María López',
      phone: '3104445566',
      username: 'anamaria',
      password: '123',
      modality: 'diario',
      price: 6000,
      start_date: getDateDaysAgo(6),
      active_days: '1,2,3,4,5',
      notes: 'Ruta Portal Norte',
      payments: [],
    },
    {
      name: 'Juan David Gómez',
      phone: '3207778899',
      username: 'juandavid',
      password: '123',
      modality: 'semanal',
      price: 40000,
      start_date: getDateDaysAgo(7),
      active_days: null,
      notes: 'Semanal - Recoger 6:45am',
      payments: [],
    },
    {
      name: 'Paola Andrea Torres',
      phone: '3158889900',
      username: 'paolatorres',
      password: '123',
      modality: 'semanal',
      price: 35000,
      start_date: getDateDaysAgo(14),
      active_days: null,
      notes: 'Semanal - Plazo límite',
      payments: [],
    },
    {
      name: 'Santiago Morales',
      phone: '3182223344',
      username: 'santiagom',
      password: '123',
      modality: 'semanal',
      price: 50000,
      start_date: getDateDaysAgo(21),
      active_days: null,
      notes: 'Semanal - 3 semanas acumuladas (+15% mora)',
      payments: [],
    },
    {
      name: 'Laura Restrepo',
      phone: '3015556677',
      username: 'laurar',
      password: '123',
      modality: 'diario',
      price: 5000,
      start_date: getDateDaysAgo(3),
      active_days: '1,2,3,4,5',
      notes: 'Al día',
      payments: [
        {
          amount: 20000,
          payment_date: getDateDaysAgo(0),
          method: 'Nequi',
          notes: 'Pago adelantado de 4 días',
        },
      ],
    },
  ];

  for (const c of clientsData) {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(c.username.toLowerCase());
    if (existing) continue;

    const hash = bcrypt.hashSync(c.password, 10);
    const userRes = db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone)
      VALUES (?, ?, 'client', ?, ?)
    `).run(c.username, hash, c.name, c.phone);

    const clientRes = db.prepare(`
      INSERT INTO clients (user_id, name, phone, modality, price, start_date, active_days, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userRes.lastInsertRowid, c.name, c.phone, c.modality, c.price, c.start_date, c.active_days, c.notes);

    const clientId = clientRes.lastInsertRowid;
    for (const p of c.payments) {
      db.prepare(`
        INSERT INTO payments (client_id, amount, payment_date, method, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(clientId, p.amount, p.payment_date, p.method, p.notes);
    }
  }

  console.log('[Seed] Datos de prueba cargados con éxito.');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
