const express = require('express');
const bcrypt = require('bcryptjs');
const dbService = require('../dbService');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login for both Owner and Client
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Por favor ingresa usuario y contraseña' });
    }

    // Find user by username or phone
    const user = await dbService.getUserByUsernameOrPhone(username);

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    let clientId = null;
    let clientInfo = null;
    if (user.role === 'client') {
      const client = await dbService.getClientByUserId(user.id);
      if (client) {
        clientId = client.id;
        clientInfo = client;
      }
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      clientId,
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        clientId,
        clientInfo,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

// Check current user session
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let clientId = null;
    let clientInfo = null;
    if (user.role === 'client') {
      const client = await dbService.getClientByUserId(user.id);
      if (client) {
        clientId = client.id;
        clientInfo = client;
      }
    }

    res.json({
      user: {
        ...user,
        clientId,
        clientInfo,
      },
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
    }

    const user = await dbService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (currentPassword) {
      const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'La contraseña actual no es correcta' });
      }
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await dbService.updateUserPassword(user.id, hash);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

module.exports = router;
