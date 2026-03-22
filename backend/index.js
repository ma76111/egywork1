require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/users', require('./routes/users'));
app.use('/api/verify', require('./routes/verify'));

// تسجيل Telegram webhook تلقائياً عند التشغيل
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
app.listen(PORT, () => console.log(`✅ الخادم يعمل على المنفذ ${PORT}`));
