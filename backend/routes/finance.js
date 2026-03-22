const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT balance, points, level FROM users WHERE id = $1', [req.user.id]);
    const txRes = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json({ ...userRes.rows[0], transactions: txRes.rows });
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, method, account_number } = req.body;
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    const minWithdraw = user.level >= 5 ? 20 : user.level >= 3 ? 50 : 100;
    if (!amount || amount < minWithdraw)
      return res.status(400).json({ message: `الحد الأدنى للسحب هو ${minWithdraw} جنيه لمستواك الحالي` });
    if (user.balance < amount)
      return res.status(400).json({ message: 'رصيدك غير كافٍ' });
    const validMethods = ['fawry', 'vodafone_cash', 'instapay', 'bank'];
    if (!validMethods.includes(method))
      return res.status(400).json({ message: 'طريقة دفع غير صحيحة' });
    await db.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
    await db.query('INSERT INTO transactions (user_id, type, amount, status, method, reference, note) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user.id, 'withdrawal', -amount, 'pending', method, account_number, `طلب سحب عبر ${method}`]);
    res.json({ message: 'تم تقديم طلب السحب، سيتم المراجعة خلال 24 ساعة' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount, method, reference } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ message: 'الحد الأدنى للإيداع 10 جنيه' });
    await db.query('INSERT INTO transactions (user_id, type, amount, status, method, reference, note) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user.id, 'deposit', amount, 'pending', method, reference, 'طلب إيداع']);
    res.json({ message: 'تم تسجيل طلب الإيداع، سيتم التفعيل بعد التحقق' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

router.get('/admin/withdrawals', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.name, u.phone FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.type = 'withdrawal' AND t.status = 'pending' ORDER BY t.created_at ASC`);
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

router.get('/admin/deposits', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.name, u.phone FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.type = 'deposit' AND t.status = 'pending' ORDER BY t.created_at ASC`);
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

router.patch('/admin/transactions/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const txRes = await db.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    const tx = txRes.rows[0];
    if (!tx) return res.status(404).json({ message: 'المعاملة غير موجودة' });
    await db.query('UPDATE transactions SET status = $1 WHERE id = $2', [status, tx.id]);
    if (status === 'rejected')
      await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [Math.abs(tx.amount), tx.user_id]);
    res.json({ message: 'تم التحديث' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

router.patch('/admin/deposits/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const txRes = await db.query("SELECT * FROM transactions WHERE id = $1 AND type = 'deposit'", [req.params.id]);
    const tx = txRes.rows[0];
    if (!tx) return res.status(404).json({ message: 'غير موجود' });
    await db.query("UPDATE transactions SET status = 'completed' WHERE id = $1", [tx.id]);
    await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [tx.amount, tx.user_id]);
    res.json({ message: 'تم تفعيل الإيداع' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

router.get('/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    const tasks = await db.query('SELECT COUNT(*) as count FROM tasks');
    const pw = await db.query("SELECT COUNT(*) as count, SUM(ABS(amount)) as total FROM transactions WHERE type='withdrawal' AND status='pending'");
    const pd = await db.query("SELECT COUNT(*) as count FROM transactions WHERE type='deposit' AND status='pending'");
    res.json({ users: users.rows[0].count, tasks: tasks.rows[0].count, pendingWithdrawals: pw.rows[0], pendingDeposits: pd.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ message: 'خطأ' }); }
});

module.exports = router;