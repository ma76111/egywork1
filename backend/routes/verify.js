const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/mailer');
const { sendTelegramMessage, BOT_USERNAME } = require('../services/telegram');

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const u = await db.query('SELECT email_verified, phone_verified FROM users WHERE id = $1', [req.user.id]);
    if (!u.rows[0]) return res.status(404).json({ message: 'user not found' });
    const tg = await db.query('SELECT id FROM telegram_links WHERE user_id = $1', [req.user.id]);
    res.json({ ...u.rows[0], telegram_linked: tg.rows.length > 0 });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.post('/send-email', authMiddleware, async (req, res) => {
  try {
    const u = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = u.rows[0];
    if (!user) return res.status(404).json({ message: 'user not found' });
    if (user.email_verified) return res.status(400).json({ message: 'already verified' });
    await db.query('DELETE FROM otp_codes WHERE user_id = $1 AND type = $2', [req.user.id, 'email']);
    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1,$2,$3,$4)', [req.user.id, code, 'email', expires]);
    await sendVerificationEmail(user.email, code);
    res.json({ message: 'sent' });
  } catch (e) { console.error('send-email error:', e.message); res.status(500).json({ message: 'email failed' }); }
});

router.get('/telegram-link', authMiddleware, async (req, res) => {
  try {
    const u = await db.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (!u.rows[0]) return res.status(404).json({ message: 'user not found' });
    await db.query('DELETE FROM otp_codes WHERE user_id = $1 AND type = $2', [req.user.id, 'phone']);
    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1,$2,$3,$4)', [req.user.id, code, 'phone', expires]);
    res.json({ botLink: `https://t.me/${BOT_USERNAME}?start=${code}`, code });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { code, type } = req.body;
    if (!code || !type) return res.status(400).json({ message: 'missing data' });
    if (!['email', 'phone'].includes(type)) return res.status(400).json({ message: 'invalid type' });
    const u = await db.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (!u.rows[0]) return res.status(404).json({ message: 'user not found' });
    const otpRes = await db.query(
      'SELECT * FROM otp_codes WHERE user_id = $1 AND code = $2 AND type = $3 AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [req.user.id, code, type]);
    const otp = otpRes.rows[0];
    if (!otp) return res.status(400).json({ message: 'كود غير صحيح' });
    if (new Date(otp.expires_at) < new Date()) return res.status(400).json({ message: 'انتهت صلاحية الكود' });
    await db.query('UPDATE otp_codes SET used = 1 WHERE id = $1', [otp.id]);
    if (type === 'email') await db.query('UPDATE users SET email_verified = 1 WHERE id = $1', [req.user.id]);
    else await db.query('UPDATE users SET phone_verified = 1 WHERE id = $1', [req.user.id]);
    res.json({ message: 'confirmed' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

router.post('/telegram-webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const msg = req.body?.message;
    if (!msg?.chat) return;
    const chatId = String(msg.chat.id);
    const text = (msg.text || '').trim();
    if (!text.startsWith('/start')) {
      await sendTelegramMessage(chatId, 'أرسل الرابط من موقع إيجي وورك للتحقق من حسابك.');
      return;
    }
    const code = text.split(' ')[1]?.trim();
    if (!code) { await sendTelegramMessage(chatId, 'أرسل الرابط من موقع إيجي وورك للتحقق من حسابك.'); return; }
    const otpRes = await db.query(
      "SELECT * FROM otp_codes WHERE code = $1 AND type = 'phone' AND used = 0 ORDER BY created_at DESC LIMIT 1",
      [code]);
    const otp = otpRes.rows[0];
    if (!otp || new Date(otp.expires_at) < new Date()) {
      await sendTelegramMessage(chatId, 'الكود غير صالح أو منتهي الصلاحية. جرب مرة أخرى من الموقع.');
      return;
    }
    await db.query('INSERT INTO telegram_links (user_id, chat_id) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET chat_id = $2', [otp.user_id, chatId]);
    await db.query('UPDATE otp_codes SET used = 1 WHERE id = $1', [otp.id]);
    await db.query('UPDATE users SET phone_verified = 1 WHERE id = $1', [otp.user_id]);
    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [otp.user_id]);
    await sendTelegramMessage(chatId, `تم ربط حسابك بنجاح! أهلاً ${userRes.rows[0]?.name || ''} 🎉`);
  } catch (e) { console.error('webhook error:', e.message); }
});

module.exports = router;
