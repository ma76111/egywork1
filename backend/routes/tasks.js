const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET all active tasks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    const params = [];
    let q = `SELECT t.*, u.name as advertiser_name FROM tasks t JOIN users u ON t.advertiser_id = u.id WHERE t.status = 'active' AND t.filled_slots < t.total_slots`;
    if (category) { q += ` AND t.category = $1`; params.push(category); }
    q += ' ORDER BY t.created_at DESC';
    const r = await db.query(q, params);
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// POST create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, proof_type, reward, total_slots } = req.body;
    if (!title || !description || !category || !reward || !total_slots)
      return res.status(400).json({ message: 'all fields required' });
    const adv = await db.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    const totalCost = reward * total_slots;
    if (!adv.rows[0] || adv.rows[0].balance < totalCost)
      return res.status(400).json({ message: `insufficient balance. needed: ${totalCost}` });
    await db.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalCost, req.user.id]);
    await db.query('INSERT INTO transactions (user_id, type, amount, status, note) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'task_payment', -totalCost, 'completed', `task: ${title}`]);
    const r = await db.query(
      'INSERT INTO tasks (advertiser_id, title, description, category, proof_type, reward, total_slots) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [req.user.id, title, description, category, proof_type || 'screenshot', reward, total_slots]);
    res.json({ message: 'task created', id: r.rows[0].id });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// IMPORTANT: specific named routes MUST come before /:id to avoid being matched as IDs

// GET worker's own submissions
router.get('/my-submissions', authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT ts.*, t.title, t.category FROM task_submissions ts JOIN tasks t ON ts.task_id = t.id WHERE ts.worker_id = $1 ORDER BY ts.created_at DESC`,
      [req.user.id]);
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// GET advertiser's own tasks
router.get('/my-tasks', authMiddleware, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM tasks WHERE advertiser_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// PATCH review a submission (advertiser)
router.patch('/submissions/:subId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const sr = await db.query(
      `SELECT ts.*, t.advertiser_id, t.reward, t.id as task_id FROM task_submissions ts JOIN tasks t ON ts.task_id = t.id WHERE ts.id = $1`,
      [req.params.subId]);
    const sub = sr.rows[0];
    if (!sub || sub.advertiser_id !== req.user.id) return res.status(403).json({ message: 'forbidden' });
    if (sub.status !== 'pending') return res.status(400).json({ message: 'already reviewed' });
    await db.query('UPDATE task_submissions SET status = $1 WHERE id = $2', [status, sub.id]);
    if (status === 'approved') {
      await db.query('UPDATE users SET balance = balance + $1, points = points + $2 WHERE id = $3',
        [sub.reward, Math.floor(sub.reward * 10), sub.worker_id]);
      await db.query('INSERT INTO transactions (user_id, type, amount, status, note) VALUES ($1,$2,$3,$4,$5)',
        [sub.worker_id, 'task_reward', sub.reward, 'completed', `reward task #${sub.task_id}`]);
      await db.query('UPDATE tasks SET filled_slots = filled_slots + 1 WHERE id = $1', [sub.task_id]);
      const wr = await db.query('SELECT referred_by FROM users WHERE id = $1', [sub.worker_id]);
      const refId = wr.rows[0] && wr.rows[0].referred_by;
      if (refId) {
        const bonus = sub.reward * 0.05;
        await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [bonus, refId]);
        await db.query('INSERT INTO transactions (user_id, type, amount, status, note) VALUES ($1,$2,$3,$4,$5)',
          [refId, 'referral_bonus', bonus, 'completed', 'referral bonus']);
      }
    }
    res.json({ message: status === 'approved' ? 'approved and paid' : 'rejected' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// GET single task by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT t.*, u.name as advertiser_name FROM tasks t JOIN users u ON t.advertiser_id = u.id WHERE t.id = $1',
      [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ message: 'task not found' });
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// POST submit proof for a task
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { proof } = req.body;
    const tr = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const task = tr.rows[0];
    if (!task || task.status !== 'active') return res.status(404).json({ message: 'task not available' });
    if (task.filled_slots >= task.total_slots) return res.status(400).json({ message: 'task full' });
    const ex = await db.query('SELECT id FROM task_submissions WHERE task_id = $1 AND worker_id = $2', [req.params.id, req.user.id]);
    if (ex.rows[0]) return res.status(400).json({ message: 'already submitted' });
    await db.query('INSERT INTO task_submissions (task_id, worker_id, proof, reward) VALUES ($1,$2,$3,$4)',
      [req.params.id, req.user.id, proof, task.reward]);
    res.json({ message: 'submitted, pending review' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// GET submissions for a task (advertiser or admin)
router.get('/:id/submissions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const tr = await db.query('SELECT * FROM tasks WHERE id = $1 AND advertiser_id = $2', [req.params.id, req.user.id]);
      if (!tr.rows[0]) return res.status(403).json({ message: 'forbidden' });
    }
    const r = await db.query(
      `SELECT ts.*, u.name as worker_name, u.phone FROM task_submissions ts JOIN users u ON ts.worker_id = u.id WHERE ts.task_id = $1`,
      [req.params.id]);
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

// PATCH update task status (pause/resume)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const tr = await db.query('SELECT id FROM tasks WHERE id = $1 AND advertiser_id = $2', [req.params.id, req.user.id]);
    if (!tr.rows[0]) return res.status(403).json({ message: 'forbidden' });
    await db.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'updated' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'error' }); }
});

module.exports = router;
