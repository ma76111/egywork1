const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'egywork_egypt_2026_super_secret';

router.post('/register', async (req, res) => {
  const { name, email, phone, password, role, referral_code } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });

  const hashed = bcrypt.hashSync(password, 10);
  const myCode = uuidv4().slice(0, 8).toUpperCase();

  try {
    let referrerId = null;
    if (referral_code) {
      const ref = await db.query('SELECT id FROM users WHERE referral_code = $1', [referral_code]);
      if (ref.rows[0]) referrerId = ref.rows[0].id;
    }

    const result = await db.query(
      'INSERT INTO users (name, email, phone, password, role, referral_code, referred_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, phone, role, balance, level, referral_code',
      [name, email, phone, hashed, role || 'worker', myCode, referrerId]
    );
    const user = result.rows[0];

    if (referrerId) {
      await db.query('INSERT INTO referrals (referrer_id, referred_id) VALUES ($1,$2)', [referrerId, user.id]);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً' });
    console.error(e);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
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
