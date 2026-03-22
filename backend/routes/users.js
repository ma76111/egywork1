const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, role, balance, points, level, referral_code, email_verified, phone_verified, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'user not found' });
  const referrals = db.prepare('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?').get(req.user.id);
  res.json({ ...user, referrals_count: referrals.count });
});

router.patch('/me', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ message: 'اسم غير صالح' });
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
  const user = db.prepare('SELECT id, name, email, phone, role, balance, points, level, referral_code FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.patch('/me/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password))
    return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ message: 'تم تغيير كلمة المرور' });
});

router.post('/update-level', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
  const level = user.points >= 5000 ? 5 : user.points >= 2000 ? 4 : user.points >= 800 ? 3 : user.points >= 200 ? 2 : 1;
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, req.user.id);
  res.json({ level });
});

router.get('/admin/users', authMiddleware, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, name, email, phone, role, balance, points, level, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.patch('/admin/users/:id/balance', authMiddleware, adminOnly, (req, res) => {
  const { amount } = req.body;
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.params.id);
  res.json({ message: 'تم تعديل الرصيد' });
});

module.exports = router;
