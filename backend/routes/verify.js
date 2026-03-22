const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/mailer');
const { sendTelegramMessage, BOT_USERNAME } = require('../services/telegram');

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

router.get('/status', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT email_verified, phone_verified FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'user not found' });
  const tg = db.prepare('SELECT id FROM telegram_links WHERE user_id = ?').get(req.user.id);
  res.json({ ...user, telegram_linked: !!tg });
});

router.post('/send-email', authMiddleware, async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ message: 'user not found' });
    if (user.email_verified) return res.status(400).json({ message: 'already verified' });
    db.prepare('DELETE FROM otp_codes WHERE user_id = ? AND type = ?').run(req.user.id, 'email');
    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES (?,?,?,?)').run(req.user.id, code, 'email', expires);
    await sendVerificationEmail(user.email, code);
    res.json({ message: 'sent' });
  } catch (e) { console.error('send-email error:', e.message); res.status(500).json({ message: 'email failed' }); }
});

router.get('/telegram-link', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'user not found' });
  db.prepare('DELETE FROM otp_codes WHERE user_id = ? AND type = ?').run(req.user.id, 'phone');
  const code = generateOTP();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES (?,?,?,?)').run(req.user.id, code, 'phone', expires);
  const botLink = `https://t.me/${BOT_USERNAME}?start=${code}`;
  res.json({ botLink, code });
});

router.post('/confirm', authMiddleware, (req, res) => {
  const { code, type } = req.body;
  if (!code || !type) return res.status(400).json({ message: 'missing data' });
  if (!['email', 'phone'].includes(type)) return res.status(400).json({ message: 'invalid type' });
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'user not found' });
  const otp = db.prepare('SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND type = ? AND used = 0 ORDER BY created_at DESC LIMIT 1').get(req.user.id, code, type);
  if (!otp) return res.status(400).json({ message: 'كود غير صحيح' });
  if (new Date(otp.expires_at) < new Date()) return res.status(400).json({ message: 'انتهت صلاحية الكود' });
  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id);
  if (type === 'email') db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(req.user.id);
  else db.prepare('UPDATE users SET phone_verified = 1 WHERE id = ?').run(req.user.id);
  res.json({ message: 'confirmed' });
});

router.post('/telegram-webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const msg = req.body && req.body.message;
    if (!msg || !msg.chat) return;
    const chatId = String(msg.chat.id);
    const text = (msg.text || '').trim();
    if (!text.startsWith('/start')) {
      await sendTelegramMessage(chatId, 'أرسل الرابط من موقع إيجي وورك للتحقق من حسابك.');
      return;
    }
    const code = text.split(' ')[1]?.trim();
    if (!code) {
      await sendTelegramMessage(chatId, 'أرسل الرابط من موقع إيجي وورك للتحقق من حسابك.');
      return;
    }
    const otp = db.prepare("SELECT * FROM otp_codes WHERE code = ? AND type = 'phone' AND used = 0 ORDER BY created_at DESC LIMIT 1").get(code);
    if (!otp || new Date(otp.expires_at) < new Date()) {
      await sendTelegramMessage(chatId, 'الكود غير صالح أو منتهي الصلاحية. جرب مرة أخرى من الموقع.');
      return;
    }
    db.prepare('INSERT OR REPLACE INTO telegram_links (user_id, chat_id) VALUES (?,?)').run(otp.user_id, chatId);
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id);
    db.prepare('UPDATE users SET phone_verified = 1 WHERE id = ?').run(otp.user_id);
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(otp.user_id);
    await sendTelegramMessage(chatId, `تم ربط حسابك بنجاح! أهلاً ${user?.name || ''} 🎉`);
  } catch (e) { console.error('webhook error:', e.message); }
});

module.exports = router;
