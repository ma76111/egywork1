const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'egywork_egypt_2026_super_secret';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'غير مصرح' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'جلسة منتهية، سجل دخولك مجدداً' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'غير مسموح' });
  next();
}

module.exports = { authMiddleware, adminOnly };
