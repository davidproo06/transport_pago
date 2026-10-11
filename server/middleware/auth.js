const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'transpago_super_secure_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Acceso restringido solo para propietarios/conductores' });
  }
  next();
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      clientId: user.clientId || null,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = {
  authenticateToken,
  requireOwner,
  generateToken,
  JWT_SECRET,
};
