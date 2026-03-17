// سكريبت لإنشاء حساب الأدمن الأول
require('./db'); // initialize DB
const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const existing = db.prepare("SELECT id FROM users WHERE email = 'admin@egywork.com'").get();
if (existing) {
  console.log('✅ حساب الأدمن موجود مسبقاً');
  process.exit(0);
}

db.prepare(`INSERT INTO users (name, email, phone, password, role, referral_code, balance) VALUES (?,?,?,?,?,?,?)`)
  .run('الأدمن', 'admin@egywork.com', '01000000000', bcrypt.hashSync('admin123', 10), 'admin', uuidv4().slice(0,8).toUpperCase(), 10000);

console.log('✅ تم إنشاء حساب الأدمن:');
console.log('   البريد: admin@egywork.com');
console.log('   كلمة المرور: admin123');
console.log('   ⚠️  غير كلمة المرور فور الدخول!');
