require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ['admin@egywork.com']
    );

    if (rows.length > 0) {
      console.log('✅ حساب الأدمن موجود مسبقاً');
    } else {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const referralCode = uuidv4().slice(0, 8).toUpperCase();

      await pool.query(
        'INSERT INTO users (name, email, phone, password, role, referral_code, balance) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['الأدمن', 'admin@egywork.com', '01000000000', hashedPassword, 'admin', referralCode, 10000]
      );

      console.log('✅ تم إنشاء حساب الأدمن: admin@egywork.com / admin123');
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

seed();
