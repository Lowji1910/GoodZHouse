const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function sanitizeUser(u) {
  return {
    id: u._id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isEmailVerified: u.isEmailVerified,
  };
}

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, fullName });

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email, fullName: user.fullName });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    const payload = require('jsonwebtoken').decode(refreshToken);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(payload.exp * 1000) });

    res.status(201).json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    let ok = false;
    if (user.passwordHash) {
      ok = await bcrypt.compare(password, user.passwordHash || '');
    } else if (user.password) {
      // TEMP: migration path for seeded users with plain 'password'
      if (password === user.password) {
        const newHash = await bcrypt.hash(password, 10);
        user.passwordHash = newHash;
        // Attempt to remove plain password field
        try {
          user.set('password', undefined, { strict: false });
          await user.updateOne({ $set: { passwordHash: newHash }, $unset: { password: '' } });
        } catch {}
        ok = true;
      }
    }

    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email, fullName: user.fullName });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    const payload = require('jsonwebtoken').decode(refreshToken);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(payload.exp * 1000) });

    res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

// Profile (get current)
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

// Profile update (basic)
router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const { fullName } = req.body || {};
    const user = await User.findByIdAndUpdate(req.user.id, { fullName }, { new: true });
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

// Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });

    const stored = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    if (!stored) return res.status(401).json({ message: 'Invalid refresh token' });

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || payload.sub !== stored.userId.toString()) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (stored.expiresAt < new Date()) return res.status(401).json({ message: 'Refresh token expired' });

    const user = await User.findById(stored.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email, fullName: user.fullName });
    res.json({ token: accessToken });
  } catch (err) {
    next(err);
  }
});

// Logout (revoke refresh)
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });

    await RefreshToken.updateOne({ token: refreshToken }, { $set: { isRevoked: true } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
