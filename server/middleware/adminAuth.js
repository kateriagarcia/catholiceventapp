const crypto = require('crypto');

// Single-instance in-memory session store — fine for v1's single hardcoded
// admin login. Sessions are lost on restart, which just means re-login.
const sessions = new Map(); // token -> expiresAt (ms epoch)
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const COOKIE_NAME = 'admin_session';

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function isValid(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!isValid(token)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
}

module.exports = { createSession, destroySession, isValid, requireAdmin, COOKIE_NAME };
