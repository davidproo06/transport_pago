const db = require('./db');
const { getFirestore, isFirebaseConfigured } = require('./firebase');

class DbService {
  isUsingFirebase() {
    return isFirebaseConfigured();
  }

  // ================= USERS =================
  async getUserByUsernameOrPhone(identifier) {
    const clean = identifier.trim().toLowerCase();
    const phone = identifier.trim();

    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      // Search by username
      const snapshot = await fs.collection('users')
        .where('username_lower', '==', clean)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // Search by phone
      const phoneSnapshot = await fs.collection('users')
        .where('phone', '==', phone)
        .limit(1)
        .get();

      if (!phoneSnapshot.empty) {
        const doc = phoneSnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      return null;
    }

    // SQLite
    return db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(username) = ? OR phone = ?
    `).get(clean, phone);
  }

  async getUserById(id) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const doc = await fs.collection('users').doc(String(id)).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    }
    return db.prepare('SELECT id, username, name, role, phone FROM users WHERE id = ?').get(id);
  }

  async createUser(userData) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const docRef = fs.collection('users').doc();
      const dataToSave = {
        ...userData,
        username_lower: userData.username.toLowerCase(),
        created_at: new Date().toISOString(),
      };
      await docRef.set(dataToSave);
      return { id: docRef.id, ...dataToSave };
    }

    const res = db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userData.username.toLowerCase(),
      userData.password_hash,
      userData.role,
      userData.name,
      userData.phone || null
    );
    return { id: res.lastInsertRowid, ...userData };
  }

  async updateUserPassword(id, passwordHash) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      await fs.collection('users').doc(String(id)).update({ password_hash: passwordHash });
      return;
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
  }

  // ================= CLIENTS =================
  async getClients() {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const snapshot = await fs.collection('clients').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return db.prepare(`
      SELECT c.*, u.username 
      FROM clients c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.is_active DESC, c.name ASC
    `).all();
  }

  async getClientById(id) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const doc = await fs.collection('clients').doc(String(id)).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    }

    return db.prepare('SELECT c.*, u.username FROM clients c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(id);
  }

  async getClientByUserId(userId) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const snapshot = await fs.collection('clients').where('user_id', '==', String(userId)).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    return db.prepare('SELECT c.*, u.username FROM clients c JOIN users u ON c.user_id = u.id WHERE c.user_id = ?').get(userId);
  }

  async createClient(clientData, userAuthData) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      // 1. Create user in Firestore
      const userRef = fs.collection('users').doc();
      const userDoc = {
        username: userAuthData.username,
        username_lower: userAuthData.username.toLowerCase(),
        password_hash: userAuthData.password_hash,
        role: 'client',
        name: clientData.name,
        phone: clientData.phone,
        created_at: new Date().toISOString(),
      };
      await userRef.set(userDoc);

      // 2. Create client in Firestore
      const clientRef = fs.collection('clients').doc();
      const clientDoc = {
        user_id: userRef.id,
        username: userAuthData.username,
        name: clientData.name,
        phone: clientData.phone,
        modality: clientData.modality,
        price: Number(clientData.price),
        start_date: clientData.start_date,
        active_days: clientData.active_days || null,
        is_active: 1,
        notes: clientData.notes || null,
        created_at: new Date().toISOString(),
      };
      await clientRef.set(clientDoc);

      return { id: clientRef.id, ...clientDoc };
    }

    // SQLite
    const insertTransaction = db.transaction(() => {
      const userResult = db.prepare(`
        INSERT INTO users (username, password_hash, role, name, phone)
        VALUES (?, ?, 'client', ?, ?)
      `).run(userAuthData.username, userAuthData.password_hash, clientData.name, clientData.phone);

      const clientResult = db.prepare(`
        INSERT INTO clients (user_id, name, phone, modality, price, start_date, active_days, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userResult.lastInsertRowid,
        clientData.name,
        clientData.phone,
        clientData.modality,
        Number(clientData.price),
        clientData.start_date,
        clientData.active_days || null,
        clientData.notes || null
      );

      return {
        userId: userResult.lastInsertRowid,
        clientId: clientResult.lastInsertRowid,
      };
    });

    const { clientId } = insertTransaction();
    return db.prepare('SELECT c.*, u.username FROM clients c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(clientId);
  }

  async updateClient(id, data) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const clientRef = fs.collection('clients').doc(String(id));
      const clientDoc = await clientRef.get();
      if (!clientDoc.exists) return null;

      const current = clientDoc.data();
      const updateData = {
        name: data.name || current.name,
        phone: data.phone || current.phone,
        modality: data.modality || current.modality,
        price: data.price !== undefined ? Number(data.price) : current.price,
        start_date: data.start_date || current.start_date,
        active_days: data.active_days !== undefined ? data.active_days : current.active_days,
        is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : current.is_active,
        notes: data.notes !== undefined ? data.notes : current.notes,
      };
      await clientRef.update(updateData);

      // Update associated user if present
      if (current.user_id) {
        const userRef = fs.collection('users').doc(String(current.user_id));
        const userUpdates = {
          name: updateData.name,
          phone: updateData.phone,
        };
        if (data.new_password_hash) {
          userUpdates.password_hash = data.new_password_hash;
        }
        await userRef.update(userUpdates);
      }

      return { id: String(id), ...updateData, username: current.username };
    }

    // SQLite
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) return null;

    db.prepare(`
      UPDATE clients
      SET name = ?, phone = ?, modality = ?, price = ?, start_date = ?, active_days = ?, is_active = ?, notes = ?
      WHERE id = ?
    `).run(
      data.name || client.name,
      data.phone || client.phone,
      data.modality || client.modality,
      data.price !== undefined ? Number(data.price) : client.price,
      data.start_date || client.start_date,
      data.active_days !== undefined ? data.active_days : client.active_days,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : client.is_active,
      data.notes !== undefined ? data.notes : client.notes,
      id
    );

    if (client.user_id) {
      db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
        data.name || client.name,
        data.phone || client.phone,
        client.user_id
      );
      if (data.new_password_hash) {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(data.new_password_hash, client.user_id);
      }
    }

    return db.prepare('SELECT c.*, u.username FROM clients c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(id);
  }

  async deleteClient(id) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const clientDoc = await fs.collection('clients').doc(String(id)).get();
      if (!clientDoc.exists) return false;
      const data = clientDoc.data();

      // Delete associated user
      if (data.user_id) {
        await fs.collection('users').doc(String(data.user_id)).delete();
      }
      // Delete client payments
      const paymentsSnap = await fs.collection('payments').where('client_id', '==', String(id)).get();
      const batch = fs.batch();
      paymentsSnap.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(clientDoc.ref);
      await batch.commit();
      return true;
    }

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) return false;

    if (client.user_id) {
      db.prepare('DELETE FROM users WHERE id = ?').run(client.user_id);
    } else {
      db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    }
    return true;
  }

  // ================= PAYMENTS =================
  async getPaymentsByClientId(clientId) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const snapshot = await fs.collection('payments')
        .where('client_id', '==', String(clientId))
        .orderBy('payment_date', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return db.prepare('SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC, id DESC').all(clientId);
  }

  async createPayment(paymentData) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const docRef = fs.collection('payments').doc();
      const record = {
        client_id: String(paymentData.client_id),
        amount: Number(paymentData.amount),
        payment_date: paymentData.payment_date,
        method: paymentData.method || 'Efectivo',
        notes: paymentData.notes || null,
        created_at: new Date().toISOString(),
      };
      await docRef.set(record);
      return { id: docRef.id, ...record };
    }

    const res = db.prepare(`
      INSERT INTO payments (client_id, amount, payment_date, method, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      paymentData.client_id,
      Number(paymentData.amount),
      paymentData.payment_date,
      paymentData.method || 'Efectivo',
      paymentData.notes || null
    );
    return { id: res.lastInsertRowid, ...paymentData };
  }

  async deletePayment(id) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const docRef = fs.collection('payments').doc(String(id));
      const doc = await docRef.get();
      if (!doc.exists) return null;
      const data = doc.data();
      await docRef.delete();
      return { id, clientId: data.client_id };
    }

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    if (!payment) return null;
    db.prepare('DELETE FROM payments WHERE id = ?').run(id);
    return { id, clientId: payment.client_id };
  }

  // ================= EXEMPTIONS =================
  async getExemptionsByClientId(clientId) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const snapshot = await fs.collection('exemptions')
        .where('client_id', '==', String(clientId))
        .orderBy('date', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return db.prepare('SELECT * FROM exemptions WHERE client_id = ? ORDER BY date DESC').all(clientId);
  }

  // ================= SETTINGS =================
  async getSettings() {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const doc = await fs.collection('settings').doc('app_config').get();
      if (!doc.exists) {
        return {
          owner_name: 'David (Administrador)',
          owner_phone: '63336030',
          yappy: '63336030',
          payment_notes: 'Puedes pagar en Efectivo directamente al conductor o por Yappy al 63336030.',
        };
      }
      return doc.data();
    }

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
  }

  async updateSettings(settingsData) {
    if (this.isUsingFirebase()) {
      const fs = getFirestore();
      const docRef = fs.collection('settings').doc('app_config');
      await docRef.set(settingsData, { merge: true });
      return this.getSettings();
    }

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    const updateTransaction = db.transaction(() => {
      Object.entries(settingsData).forEach(([k, v]) => {
        if (v !== undefined) upsert.run(k, String(v));
      });
    });
    updateTransaction();
    return this.getSettings();
  }

  // ================= SYNC ALL SQLITE DATA TO FIRESTORE =================
  async syncSQLiteToFirestore() {
    if (!this.isUsingFirebase()) {
      throw new Error('Firebase no está configurado aún. Agrega serviceAccountKey.json primero.');
    }

    const fs = getFirestore();
    const batch = fs.batch();

    // 1. Users
    const users = db.prepare('SELECT * FROM users').all();
    for (const u of users) {
      const docRef = fs.collection('users').doc(String(u.id));
      batch.set(docRef, {
        username: u.username,
        username_lower: u.username.toLowerCase(),
        password_hash: u.password_hash,
        role: u.role,
        name: u.name,
        phone: u.phone,
        created_at: u.created_at || new Date().toISOString(),
      });
    }

    // 2. Clients
    const clients = db.prepare('SELECT c.*, u.username FROM clients c LEFT JOIN users u ON c.user_id = u.id').all();
    for (const c of clients) {
      const docRef = fs.collection('clients').doc(String(c.id));
      batch.set(docRef, {
        user_id: String(c.user_id),
        username: c.username || '',
        name: c.name,
        phone: c.phone,
        modality: c.modality,
        price: Number(c.price),
        start_date: c.start_date,
        active_days: c.active_days || null,
        is_active: c.is_active,
        notes: c.notes || null,
        created_at: c.created_at || new Date().toISOString(),
      });
    }

    // 3. Payments
    const payments = db.prepare('SELECT * FROM payments').all();
    for (const p of payments) {
      const docRef = fs.collection('payments').doc(String(p.id));
      batch.set(docRef, {
        client_id: String(p.client_id),
        amount: Number(p.amount),
        payment_date: p.payment_date,
        method: p.method,
        notes: p.notes || null,
        created_at: p.created_at || new Date().toISOString(),
      });
    }

    // 4. Settings
    const settings = await this.getSettings();
    batch.set(fs.collection('settings').doc('app_config'), settings);

    await batch.commit();
    return {
      usersCount: users.length,
      clientsCount: clients.length,
      paymentsCount: payments.length,
    };
  }
}

module.exports = new DbService();

