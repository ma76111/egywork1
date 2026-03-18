const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/mailer');
const { sendVerificationSMS } = require('../services/sms');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 دقائق
}

// إرسال كود تأكيد البريد
router.post('/send-email', authMiddleware, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.email_verified) return res.status(400).json({ message: 'البريد مؤكد مسبقاً' });

  const code = generateCode();
  db.prepare('DELETE FROM otp_codes WHERE user_id = ? AND type = ?').run(user.id, 'email');
  db.prepare('INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES (?,?,?,?)').run(user.id, code, 'email', getExpiry());

  try {
    await sendVerificationEmail(user.email, code);
    res.json({ message: 'تم إرسال الكود على بريدك الإلكتروني' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'فشل إرسال البريد، تحقق من إعدادات SMTP' });
  }
});

// إرسال كود تأكيد الهاتف
router.post('/send-phone', authMiddleware, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.phone_verified) return res.status(400).json({ message: 'رقم الهاتف مؤكد مسبقاً' });

  const code = generateCode();
  db.prepare('DELETE FROM otp_codes WHERE user_id = ? AND type = ?').run(user.id, 'phone');
  db.prepare('INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES (?,?,?,?)').run(user.id, code, 'phone', getExpiry());

  try {
    await sendVerificationSMS(user.phone, code);
    res.json({ message: 'تم إرسال الكود على موبايلك' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'فشل إرسال SMS' });
  }
});

// تأكيد الكود
router.post('/confirm', authMiddleware, (req, res) => {
  const { code, type } = req.body; // type: email | phone
  if (!code || !type) return res.status(400).json({ message: 'بيانات ناقصة' });

  const otp = db.prepare(
    'SELECT * FROM otp_codes WHERE user_id = ? AND type = ? AND used = 0 ORDER BY created_at DESC LIMIT 1'
  ).get(req.user.id, type);

  if (!otp) return res.status(400).json({ message: 'لا يوجد كود مرسل' });
  if (new Date(otp.expires_at) < new Date()) return res.status(400).json({ message: 'الكود منتهي الصلاحية، أرسل كوداً جديداً' });
  if (otp.code !== code.trim()) return res.status(400).json({ message: 'الكود غير صحيح' });

  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id);

  if (type === 'email') {
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(req.user.id);
  } else {
    db.prepare('UPDATE users SET phone_verified = 1, is_verified = 1 WHERE id = ?').run(req.user.id);
  }

  res.json({ message: type === 'email' ? 'تم تأكيد البريد الإلكتروني ✓' : 'تم تأكيد رقم الهاتف ✓' });
});

// حالة التحقق
router.get('/status', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT email_verified, phone_verified FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
