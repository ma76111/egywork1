// Run manually after deployment: node seed.js
// Creates the first admin account
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const existing = await pool.query("SELECT id FROM users WHERE email = 'admin@egywork.com'");
  if (existing.rows[0]) {
    console.log('✅ حساب الأدمن موجود مسبقاً');
    await pool.end();
    process.exit(0);
  }

  const hashed = bcrypt.hashSync('admin123', 10);
  const code = uuidv4().slice(0, 8).toUpperCase();

  await pool.query(
    'INSERT INTO users (name, email, phone, password, role, referral_code, balance) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['الأدمن', 'admin@egywork.com', '01000000000', hashed, 'admin', code, 10000]
  );

  console.log('✅ تم إنشاء حساب الأدمن:');
  console.log('   البريد: admin@egywork.com');
  console.log('   كلمة المرور: admin123');
  console.log('   ⚠️  غير كلمة المرور فور الدخول!');
  await pool.end();
  process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
