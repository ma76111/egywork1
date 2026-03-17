const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// بروفايل المستخدم
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, role, balance, points, level, referral_code, created_at FROM users WHERE id = ?').get(req.user.id);
  const referrals = db.prepare('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?').get(req.user.id);
  res.json({ ...user, referrals_count: referrals.count });
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
