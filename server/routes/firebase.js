const express = require('express');
const fs = require('fs');
const path = require('path');
const { isFirebaseConfigured, initFirebase, getFirestore } = require('../firebase');
const dbService = require('../dbService');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

// GET Firebase connection status
router.get('/status', authenticateToken, requireOwner, (req, res) => {
  try {
    const connected = isFirebaseConfigured();
    let projectId = null;

    if (connected) {
      const fsDb = getFirestore();
      projectId = fsDb?.projectId || 'Conectado a Firebase';
    }

    res.json({
      connected,
      mode: connected ? 'Firebase Firestore (Nube)' : 'Base de datos Local (SQLite)',
      projectId,
      instructions: !connected
        ? 'Para conectar Firebase: Descarga tu archivo serviceAccountKey.json desde la consola de Firebase (Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada) y pégalo aquí o colócalo en la carpeta server/.'
        : 'Tu base de datos está conectada y funcionando en la nube con Google Firebase Firestore.',
    });
  } catch (err) {
    console.error('Firebase status error:', err);
    res.status(500).json({ error: 'Error al consultar estado de Firebase' });
  }
});

// POST Upload / Configure Firebase Service Account JSON from Admin UI
router.post('/configure', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { serviceAccountJson } = req.body;

    if (!serviceAccountJson) {
      return res.status(400).json({ error: 'Debes enviar el contenido JSON de serviceAccountKey' });
    }

    let parsed = null;
    try {
      parsed = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
    } catch {
      return res.status(400).json({ error: 'El contenido proporcionado no es un JSON válido' });
    }

    if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
      return res.status(400).json({ error: 'El JSON no parece ser una clave de cuenta de servicio de Firebase válida (falta project_id, private_key o client_email)' });
    }

    // Save to server/serviceAccountKey.json
    const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    fs.writeFileSync(keyPath, JSON.stringify(parsed, null, 2), 'utf8');

    // Initialize Firebase
    initFirebase();

    // Automatically sync existing SQLite data to Firebase Firestore
    let syncResult = null;
    try {
      syncResult = await dbService.syncSQLiteToFirestore();
    } catch (syncErr) {
      console.warn('Sync warning:', syncErr.message);
    }

    res.json({
      message: `Firebase Firestore conectado exitosamente al proyecto ${parsed.project_id}`,
      projectId: parsed.project_id,
      syncResult,
    });
  } catch (err) {
    console.error('Configure Firebase error:', err);
    res.status(500).json({ error: err.message || 'Error al conectar Firebase' });
  }
});

// POST Sync SQLite data to Firestore
router.post('/sync', authenticateToken, requireOwner, async (req, res) => {
  try {
    if (!isFirebaseConfigured()) {
      return res.status(400).json({ error: 'Firebase no está configurado aún' });
    }
    const result = await dbService.syncSQLiteToFirestore();
    res.json({
      message: 'Datos sincronizados exitosamente a Firestore',
      result,
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message || 'Error al sincronizar datos' });
  }
});

module.exports = router;

