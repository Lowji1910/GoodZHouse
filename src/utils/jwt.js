const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES || '15m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES || '7d';
const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
