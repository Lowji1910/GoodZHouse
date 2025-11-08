const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('../utils/jwt');

function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email, fullName: payload.fullName };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
