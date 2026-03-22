require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/users', require('./routes/users'));
app.use('/api/verify', require('./routes/verify'));

// Auto-seed admin on first run
async function seedAdmin() {
  try {
    const r = await db.query("SELECT id FROM users WHERE email = 'admin@egywork.com'");
    if (r.rows[0]) return;
    await db.query(
      'INSERT INTO users (name, email, phone, password, role, referral_code, balance) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      ['الأدمن', 'admin@egywork.com', '01000000000', bcrypt.hashSync('admin123', 10), 'admin', uuidv4().slice(0,8).toUpperCase(), 10000]
    );
    console.log('✅ Admin created: admin@egywork.com / admin123');
  } catch (e) { console.error('Seed error:', e.message); }
}

// Register Telegram webhook
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL;
if (TELEGRAM_TOKEN && APP_URL) {
  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `${APP_URL}/api/verify/telegram-webhook` }),
  }).then(r => r.json()).then(d => console.log('Telegram webhook:', d.description))
    .catch(e => console.error('Telegram webhook error:', e.message));
}

app.get('/', (req, res) => res.json({ message: 'EgyWork API يعمل بنجاح' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  setTimeout(seedAdmin, 2000);
});
