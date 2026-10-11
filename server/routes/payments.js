const express = require('express');
const dbService = require('../dbService');
const { authenticateToken, requireOwner } = require('../middleware/auth');
const { calculateClientDebt, formatDateISO } = require('../debtEngine');

const router = express.Router();

// Helper to get client with debt calculation
async function getClientWithDebt(clientId) {
  const client = await dbService.getClientById(clientId);
  if (!client) return null;
  const payments = await dbService.getPaymentsByClientId(clientId);
  const exemptions = await dbService.getExemptionsByClientId(clientId);
  const debt = calculateClientDebt(client, payments, exemptions);
  return {
    ...client,
    debt,
    paymentsCount: payments.length,
    lastPayment: payments[0] || null,
  };
}

// POST register a new payment (Owner only)
router.post('/', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { client_id, amount, payment_date, method, notes } = req.body;

    if (!client_id || amount === undefined) {
      return res.status(400).json({ error: 'ID de cliente y monto son requeridos' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const client = await dbService.getClientById(client_id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const dateVal = payment_date || formatDateISO(new Date());
    const methodVal = method || 'Efectivo';

    const createdPayment = await dbService.createPayment({
      client_id,
      amount: numAmount,
      payment_date: dateVal,
      method: methodVal,
      notes: notes || null,
    });

    const updatedClient = await getClientWithDebt(client_id);

    res.status(201).json({
      message: 'Pago registrado exitosamente',
      paymentId: createdPayment.id,
      client: updatedClient,
    });
  } catch (err) {
    console.error('Register payment error:', err);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

// GET all payments for a client
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const client = await dbService.getClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Role check: client can only see their own payments
    if (req.user.role === 'client' && String(client.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const payments = await dbService.getPaymentsByClientId(clientId);
    res.json({ payments });
  } catch (err) {
    console.error('Get client payments error:', err);
    res.status(500).json({ error: 'Error al obtener historial de pagos' });
  }
});

// DELETE a payment (Owner only)
router.delete('/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const result = await dbService.deletePayment(paymentId);

    if (!result) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const updatedClient = await getClientWithDebt(result.clientId);

    res.json({
      message: 'Pago eliminado correctamente',
      client: updatedClient,
    });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Error al eliminar el pago' });
  }
});

module.exports = router;
