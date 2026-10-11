const express = require('express');
const dbService = require('../dbService');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

// GET settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT settings (Owner only)
router.put('/', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { owner_name, owner_phone, yappy, nequi, daviplata, banco, payment_notes } = req.body;

    const settingsData = {
      ...(owner_name !== undefined ? { owner_name } : {}),
      ...(owner_phone !== undefined ? { owner_phone } : {}),
      ...(yappy !== undefined ? { yappy } : {}),
      ...(nequi !== undefined ? { nequi } : {}),
      ...(daviplata !== undefined ? { daviplata } : {}),
      ...(banco !== undefined ? { banco } : {}),
      ...(payment_notes !== undefined ? { payment_notes } : {}),
    };

    const updatedSettings = await dbService.updateSettings(settingsData);

    res.json({
      message: 'Configuración guardada exitosamente',
      settings: updatedSettings,
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

module.exports = router;
