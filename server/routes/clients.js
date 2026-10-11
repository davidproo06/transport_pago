const express = require('express');
const bcrypt = require('bcryptjs');
const dbService = require('../dbService');
const { authenticateToken, requireOwner } = require('../middleware/auth');
const { calculateClientDebt, formatDateISO } = require('../debtEngine');

const router = express.Router();

// Helper to get client with debt calculation
async function getClientWithDebt(client) {
  const payments = await dbService.getPaymentsByClientId(client.id);
  const exemptions = await dbService.getExemptionsByClientId(client.id);
  const debt = calculateClientDebt(client, payments, exemptions);
  return {
    ...client,
    debt,
    paymentsCount: payments.length,
    lastPayment: payments[0] || null,
  };
}

// GET all clients (Owner only)
router.get('/', authenticateToken, requireOwner, async (req, res) => {
  try {
    const clients = await dbService.getClients();
    const clientsWithDebt = await Promise.all(clients.map(getClientWithDebt));

    // Summary counters
    let totalPendingDebt = 0;
    let totalAlDia = 0;
    let totalAlerts = 0; // llamado_atencion or dentro_plazo
    let totalMora = 0;   // mora or recargo_mora

    for (const c of clientsWithDebt) {
      if (c.is_active) {
        totalPendingDebt += c.debt.totalToPay;
        if (c.debt.status === 'al_dia') totalAlDia++;
        else if (c.debt.status === 'recargo_mora' || c.debt.status === 'mora') totalMora++;
        else totalAlerts++;
      }
    }

    res.json({
      clients: clientsWithDebt,
      summary: {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.is_active).length,
        totalPendingDebt,
        totalAlDia,
        totalAlerts,
        totalMora,
      },
    });
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Error al obtener lista de clientes' });
  }
});

// GET current client's own portal status (Client role)
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    let client = null;
    if (req.user.role === 'client') {
      client = await dbService.getClientByUserId(req.user.id);
    } else if (req.user.role === 'owner' && req.query.clientId) {
      client = await dbService.getClientById(req.query.clientId);
    }

    if (!client) {
      return res.status(404).json({ error: 'No se encontró información del cliente' });
    }

    const clientWithDebt = await getClientWithDebt(client);
    const payments = await dbService.getPaymentsByClientId(client.id);
    const settings = await dbService.getSettings();

    res.json({
      client: clientWithDebt,
      payments: payments.slice(0, 10),
      paymentAccounts: {
        ownerName: settings.owner_name || 'David (Administrador)',
        ownerPhone: settings.owner_phone || '63336030',
        yappy: settings.yappy || '63336030',
        nequi: settings.nequi,
        daviplata: settings.daviplata,
        banco: settings.banco,
        notes: settings.payment_notes,
      },
    });
  } catch (err) {
    console.error('My status error:', err);
    res.status(500).json({ error: 'Error al cargar estado del cliente' });
  }
});

// GET single client by ID (Owner or matching Client)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await dbService.getClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Security check: client can only see their own profile
    if (req.user.role === 'client' && String(client.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const clientWithDebt = await getClientWithDebt(client);
    const payments = await dbService.getPaymentsByClientId(clientId);
    const exemptions = await dbService.getExemptionsByClientId(clientId);

    res.json({
      client: clientWithDebt,
      payments,
      exemptions,
    });
  } catch (err) {
    console.error('Get client detail error:', err);
    res.status(500).json({ error: 'Error al obtener detalle del cliente' });
  }
});

// POST create new client (Owner only)
router.post('/', authenticateToken, requireOwner, async (req, res) => {
  try {
    const {
      name,
      phone,
      username,
      password,
      modality,
      price,
      start_date,
      active_days,
      notes,
    } = req.body;

    if (!name || !phone || !modality || price === undefined) {
      return res.status(400).json({ error: 'Nombre, teléfono, modalidad y precio son obligatorios' });
    }

    if (!['diario', 'semanal'].includes(modality)) {
      return res.status(400).json({ error: 'La modalidad debe ser "diario" o "semanal"' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'El precio debe ser un número válido' });
    }

    // Clean username: if not provided, derive from phone or name
    let cleanUsername = username ? username.trim().toLowerCase() : phone.trim().replace(/\D/g, '');
    if (!cleanUsername) {
      cleanUsername = name.trim().toLowerCase().replace(/\s+/g, '') + Math.floor(100 + Math.random() * 900);
    }

    // Check if username already exists
    const existingUser = await dbService.getUserByUsernameOrPhone(cleanUsername);
    if (existingUser) {
      return res.status(400).json({ error: `El nombre de usuario "${cleanUsername}" ya está en uso. Por favor elige otro.` });
    }

    // Password: if not provided, use last 4 digits of phone or 1234
    const initialPassword = password && password.trim() ? password.trim() : (phone.length >= 4 ? phone.slice(-4) : '1234');
    const passwordHash = bcrypt.hashSync(initialPassword, 10);

    const startDateVal = start_date || formatDateISO(new Date());
    const activeDaysVal = modality === 'diario' ? (active_days || '1,2,3,4,5') : null;

    const newClient = await dbService.createClient(
      {
        name: name.trim(),
        phone: phone.trim(),
        modality,
        price: numPrice,
        start_date: startDateVal,
        active_days: activeDaysVal,
        notes: notes || null,
      },
      {
        username: cleanUsername,
        password_hash: passwordHash,
      }
    );

    const clientWithDebt = await getClientWithDebt(newClient);

    res.status(201).json({
      message: 'Cliente registrado exitosamente',
      client: clientWithDebt,
      initialCredentials: {
        username: cleanUsername,
        password: initialPassword,
      },
    });
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ error: err.message || 'Error al crear cliente' });
  }
});

// PUT update client (Owner only)
router.put('/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await dbService.getClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const {
      name,
      phone,
      modality,
      price,
      start_date,
      active_days,
      is_active,
      notes,
      new_password,
    } = req.body;

    const numPrice = price !== undefined ? Number(price) : client.price;
    const activeStatus = is_active !== undefined ? (is_active ? 1 : 0) : client.is_active;

    let newPasswordHash = null;
    if (new_password && new_password.trim()) {
      newPasswordHash = bcrypt.hashSync(new_password.trim(), 10);
    }

    const updated = await dbService.updateClient(clientId, {
      name,
      phone,
      modality,
      price: numPrice,
      start_date,
      active_days,
      is_active: activeStatus,
      notes,
      new_password_hash: newPasswordHash,
    });

    const clientWithDebt = await getClientWithDebt(updated);

    res.json({
      message: 'Cliente actualizado correctamente',
      client: clientWithDebt,
    });
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// DELETE client (Owner only)
router.delete('/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const clientId = req.params.id;
    const success = await dbService.deleteClient(clientId);

    if (!success) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

module.exports = router;
