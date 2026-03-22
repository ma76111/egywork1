// سكريبت لإنشاء حساب الأدمن الأول
require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  // Wait a moment for DB init to complete
  await new Promise(r => setTimeout(r, 1000));

  const existing = await db.query("SELECT id FROM users WHERE email = 'admin@egywork.com'");
  if (existing.rows[0]) {
    console.log('✅ حساب الأدمن موجود مسبقاً');
    process.exit(0);
  }

  const hashed = bcrypt.hashSync('admin123', 10);
  const code = uuidv4().slice(0, 8).toUpperCase();

  await db.query(
    'INSERT INTO users (name, email, phone, password, role, referral_code, balance) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['الأدمن', 'admin@egywork.com', '01000000000', hashed, 'admin', code, 10000]
  );

  console.log('✅ تم إنشاء حساب الأدمن:');
  console.log('   البريد: admin@egywork.com');
  console.log('   كلمة المرور: admin123');
  console.log('   ⚠️  غير كلمة المرور فور الدخول!');
  process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
