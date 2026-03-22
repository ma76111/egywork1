const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/balance', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT balance, points, level FROM users WHERE id = ?').get(req.user.id);
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json({ ...user, transactions });
});

router.post('/withdraw', authMiddleware, (req, res) => {
  const { amount, method, account_number } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const minWithdraw = user.level >= 5 ? 20 : user.level >= 3 ? 50 : 100;
  if (!amount || amount < minWithdraw)
    return res.status(400).json({ message: `الحد الأدنى للسحب هو ${minWithdraw} جنيه لمستواك الحالي` });
  if (user.balance < amount)
    return res.status(400).json({ message: 'رصيدك غير كافٍ' });
  const validMethods = ['fawry', 'vodafone_cash', 'instapay', 'bank'];
  if (!validMethods.includes(method))
    return res.status(400).json({ message: 'طريقة دفع غير صحيحة' });
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
  db.prepare('INSERT INTO transactions (user_id, type, amount, status, method, reference, note) VALUES (?,?,?,?,?,?,?)').run(
    req.user.id, 'withdrawal', -amount, 'pending', method, account_number, `طلب سحب عبر ${method}`
  );
  res.json({ message: 'تم تقديم طلب السحب، سيتم المراجعة خلال 24 ساعة' });
});

router.post('/deposit', authMiddleware, (req, res) => {
  const { amount, method, reference } = req.body;
  if (!amount || amount < 10) return res.status(400).json({ message: 'الحد الأدنى للإيداع 10 جنيه' });
  db.prepare('INSERT INTO transactions (user_id, type, amount, status, method, reference, note) VALUES (?,?,?,?,?,?,?)').run(
    req.user.id, 'deposit', amount, 'pending', method, reference, 'طلب إيداع'
  );
  res.json({ message: 'تم تسجيل طلب الإيداع، سيتم التفعيل بعد التحقق' });
});

router.get('/admin/withdrawals', authMiddleware, adminOnly, (req, res) => {
  const list = db.prepare(`
    SELECT t.*, u.name, u.phone FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.type = 'withdrawal' AND t.status = 'pending'
    ORDER BY t.created_at ASC
  `).all();
  res.json(list);
});

router.get('/admin/deposits', authMiddleware, adminOnly, (req, res) => {
  const list = db.prepare(`
    SELECT t.*, u.name, u.phone FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.type = 'deposit' AND t.status = 'pending'
    ORDER BY t.created_at ASC
  `).all();
  res.json(list);
});

router.patch('/admin/transactions/:id', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!tx) return res.status(404).json({ message: 'المعاملة غير موجودة' });
  db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run(status, tx.id);
  if (status === 'rejected')
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(Math.abs(tx.amount), tx.user_id);
  res.json({ message: 'تم التحديث' });
});

router.patch('/admin/deposits/:id', authMiddleware, adminOnly, (req, res) => {
  const tx = db.prepare("SELECT * FROM transactions WHERE id = ? AND type = 'deposit'").get(req.params.id);
  if (!tx) return res.status(404).json({ message: 'غير موجود' });
  db.prepare("UPDATE transactions SET status = 'completed' WHERE id = ?").run(tx.id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(tx.amount, tx.user_id);
  res.json({ message: 'تم تفعيل الإيداع' });
});

router.get('/admin/stats', authMiddleware, adminOnly, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const tasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count, SUM(ABS(amount)) as total FROM transactions WHERE type='withdrawal' AND status='pending'").get();
  const pendingDeposits = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type='deposit' AND status='pending'").get();
  res.json({ users: users.count, tasks: tasks.count, pendingWithdrawals, pendingDeposits });
});

module.exports = router;
