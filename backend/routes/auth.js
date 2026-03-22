const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'egywork_egypt_2026_super_secret';

router.post('/register', (req, res) => {
  const { name, email, phone, password, role, referral_code } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });

  const hashed = bcrypt.hashSync(password, 10);
  const myCode = uuidv4().slice(0, 8).toUpperCase();

  let referrer = null;
  if (referral_code) {
    referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referral_code);
  }

  try {
    const result = db.prepare(
      'INSERT INTO users (name, email, phone, password, role, referral_code, referred_by) VALUES (?,?,?,?,?,?,?)'
    ).run(name, email, phone, hashed, role || 'worker', myCode, referrer?.id || null);

    if (referrer) {
      db.prepare('INSERT INTO referrals (referrer_id, referred_id) VALUES (?,?)').run(referrer.id, result.lastInsertRowid);
    }

    const user = db.prepare('SELECT id, name, email, phone, role, balance, level, referral_code FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE'))
      return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً' });
    console.error(e);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: 'بيانات غير صحيحة' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

module.exports = router;
