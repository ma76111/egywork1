const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// بروفايل المستخدم
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, role, balance, points, level, referral_code, created_at FROM users WHERE id = ?').get(req.user.id);
  const referrals = db.prepare('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?').get(req.user.id);
  res.json({ ...user, referrals_count: referrals.count });
});

// تحديث الاسم
router.patch('/me', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ message: 'اسم غير صالح' });
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
  const user = db.prepare('SELECT id, name, email, phone, role, balance, points, level, referral_code FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// تغيير كلمة المرور
router.patch('/me/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
});

// تحديث المستوى بناءً على النقاط
router.post('/update-level', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
  let level = 1;
  if (user.points >= 5000) level = 5;
  else if (user.points >= 2000) level = 4;
  else if (user.points >= 800) level = 3;
  else if (user.points >= 200) level = 2;
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, req.user.id);
  res.json({ level });
});

// قائمة المستخدمين (أدمن)
router.get('/admin/users', authMiddleware, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, name, email, phone, role, balance, points, level, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// تعديل رصيد مستخدم (أدمن)
router.patch('/admin/users/:id/balance', authMiddleware, adminOnly, (req, res) => {
  const { amount } = req.body;
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.params.id);
  res.json({ message: 'تم تعديل الرصيد' });
});

module.exports = router;
