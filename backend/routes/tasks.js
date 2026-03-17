const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// جلب المهام المتاحة للعمال
router.get('/', authMiddleware, (req, res) => {
  const { category } = req.query;
  let query = `SELECT t.*, u.name as advertiser_name FROM tasks t 
               JOIN users u ON t.advertiser_id = u.id 
               WHERE t.status = 'active' AND t.filled_slots < t.total_slots`;
  const params = [];
  if (category) { query += ' AND t.category = ?'; params.push(category); }
  query += ' ORDER BY t.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// إنشاء مهمة جديدة (معلن)
router.post('/', authMiddleware, (req, res) => {
  const { title, description, category, proof_type, reward, total_slots } = req.body;
  if (!title || !description || !category || !reward || !total_slots) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }
  const advertiser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const totalCost = reward * total_slots;
  if (advertiser.balance < totalCost) {
    return res.status(400).json({ message: `رصيدك غير كافٍ. المطلوب: ${totalCost} جنيه` });
  }

  // خصم التكلفة من رصيد المعلن
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalCost, req.user.id);
  db.prepare('INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?,?,?,?,?)').run(
    req.user.id, 'task_payment', -totalCost, 'completed', `نشر مهمة: ${title}`
  );

  const result = db.prepare(
    'INSERT INTO tasks (advertiser_id, title, description, category, proof_type, reward, total_slots) VALUES (?,?,?,?,?,?,?)'
  ).run(req.user.id, title, description, category, proof_type || 'screenshot', reward, total_slots);

  res.json({ message: 'تم نشر المهمة بنجاح', id: result.lastInsertRowid });
});

// تقديم إثبات إتمام مهمة
router.post('/:id/submit', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const workerId = req.user.id;
  const { proof } = req.body;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task || task.status !== 'active') return res.status(404).json({ message: 'المهمة غير متاحة' });
  if (task.filled_slots >= task.total_slots) return res.status(400).json({ message: 'المهمة اكتملت' });

  const existing = db.prepare('SELECT id FROM task_submissions WHERE task_id = ? AND worker_id = ?').get(taskId, workerId);
  if (existing) return res.status(400).json({ message: 'قدمت هذه المهمة مسبقاً' });

  db.prepare('INSERT INTO task_submissions (task_id, worker_id, proof, reward) VALUES (?,?,?,?)').run(taskId, workerId, proof, task.reward);
  res.json({ message: 'تم تقديم المهمة، في انتظار المراجعة' });
});

// مهامي المقدمة (عامل)
router.get('/my-submissions', authMiddleware, (req, res) => {
  const subs = db.prepare(`
    SELECT ts.*, t.title, t.category FROM task_submissions ts
    JOIN tasks t ON ts.task_id = t.id
    WHERE ts.worker_id = ? ORDER BY ts.created_at DESC
  `).all(req.user.id);
  res.json(subs);
});

// مهامي المنشورة (معلن)
router.get('/my-tasks', authMiddleware, (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE advertiser_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(tasks);
});

// مراجعة تقديمات مهمة (معلن)
router.get('/:id/submissions', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND advertiser_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(403).json({ message: 'غير مسموح' });
  const subs = db.prepare(`
    SELECT ts.*, u.name as worker_name, u.phone FROM task_submissions ts
    JOIN users u ON ts.worker_id = u.id WHERE ts.task_id = ?
  `).all(req.params.id);
  res.json(subs);
});

// قبول أو رفض تقديم (معلن)
router.patch('/submissions/:subId', authMiddleware, (req, res) => {
  const { status } = req.body; // approved | rejected
  const sub = db.prepare(`
    SELECT ts.*, t.advertiser_id, t.reward, t.id as task_id FROM task_submissions ts
    JOIN tasks t ON ts.task_id = t.id WHERE ts.id = ?
  `).get(req.params.subId);

  if (!sub || sub.advertiser_id !== req.user.id) return res.status(403).json({ message: 'غير مسموح' });
  if (sub.status !== 'pending') return res.status(400).json({ message: 'تمت المراجعة مسبقاً' });

  db.prepare('UPDATE task_submissions SET status = ? WHERE id = ?').run(status, sub.id);

  if (status === 'approved') {
    // دفع مكافأة للعامل
    db.prepare('UPDATE users SET balance = balance + ?, points = points + ? WHERE id = ?').run(sub.reward, Math.floor(sub.reward * 10), sub.worker_id);
    db.prepare('INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?,?,?,?,?)').run(
      sub.worker_id, 'task_reward', sub.reward, 'completed', `مكافأة مهمة #${sub.task_id}`
    );
    db.prepare('UPDATE tasks SET filled_slots = filled_slots + 1 WHERE id = ?').run(sub.task_id);

    // مكافأة الإحالة (5% للمُحيل)
    const worker = db.prepare('SELECT referred_by FROM users WHERE id = ?').get(sub.worker_id);
    if (worker?.referred_by) {
      const bonus = sub.reward * 0.05;
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(bonus, worker.referred_by);
      db.prepare('INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?,?,?,?,?)').run(
        worker.referred_by, 'referral_bonus', bonus, 'completed', 'مكافأة إحالة'
      );
    }
  }
  res.json({ message: status === 'approved' ? 'تم القبول ودفع المكافأة' : 'تم الرفض' });
});

module.exports = router;
