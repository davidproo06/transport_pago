const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Ensure DB is initialized
require('./db');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const paymentRoutes = require('./routes/payments');
const settingsRoutes = require('./routes/settings');
const firebaseRoutes = require('./routes/firebase');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/firebase', firebaseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TransPago API', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback for SPA routing (compatible with Express 5)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <h2>TransPago API corriendo en puerto ${PORT}</h2>
        <p>El cliente frontend en desarrollo corre en <a href="http://localhost:5173">http://localhost:5173</a>.</p>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 TransPago Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log(`👥 Cuenta de Administrador: admin / davidFF06`);
  console.log(`===============================================`);
});
