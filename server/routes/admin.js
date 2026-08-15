const express = require('express');
const { createSession, destroySession, requireAdmin, COOKIE_NAME } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = createSession();
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 60 * 60 * 1000,
    });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

router.post('/logout', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) destroySession(token);
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
