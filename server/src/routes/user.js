const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/user/me
router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, coins: true, gems: true, isAdmin: true, createdAt: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET /api/user/history?page=1&limit=20
router.get('/history', auth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [spins, total] = await Promise.all([
    prisma.spin.findMany({
      where: { userId: req.user.id },
      include: { prize: { select: { label: true, currency: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.spin.count({ where: { userId: req.user.id } })
  ]);

  res.json({ spins, total, page, pages: Math.ceil(total / limit) });
});

module.exports = router;
