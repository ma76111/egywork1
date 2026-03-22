const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id, name, email, phone, role, balance, points, level, referral_code, email_verified, phone_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ message: 'user not found' });
    const ref = await db.query('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1', [req.user.id]);
    res.json({ ...r.rows[0], referrals_count: ref.rows[0].count });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ message: 'اسم غير صالح' });
    const r = await db.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, phone, role, balance, points, level, referral_code',
      [name.trim(), req.user.id]
    );
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.patch('/me/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const r = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!bcrypt.compareSync(current_password, r.rows[0].password))
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [bcrypt.hashSync(new_password, 10), req.user.id]);
    res.json({ message: 'تم تغيير كلمة المرور' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.post('/update-level', authMiddleware, async (req, res) => {
  try {
    const r = await db.query('SELECT points FROM users WHERE id = $1', [req.user.id]);
    const pts = r.rows[0].points;
    const level = pts >= 5000 ? 5 : pts >= 2000 ? 4 : pts >= 800 ? 3 : pts >= 200 ? 2 : 1;
    await db.query('UPDATE users SET level = $1 WHERE id = $2', [level, req.user.id]);
    res.json({ level });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.get('/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const r = await db.query('SELECT id, name, email, phone, role, balance, points, level, created_at FROM users ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.patch('/admin/users/:id/balance', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { amount } = req.body;
    await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, req.params.id]);
    res.json({ message: 'تم تعديل الرصيد' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

module.exports = router;
