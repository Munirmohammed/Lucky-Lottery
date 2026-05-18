const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const adminAuth = require('../middleware/adminAuth');

const prisma = new PrismaClient();

// GET /api/admin/prizes
router.get('/prizes', adminAuth, async (req, res) => {
  const prizes = await prisma.prizeConfig.findMany({ orderBy: { weight: 'desc' } });
  res.json(prizes);
});

// PATCH /api/admin/prizes/:id — update weight, amount, enabled
router.patch('/prizes/:id', adminAuth, async (req, res) => {
  const { weight, amount, enabled, label } = req.body;
  const data = {};
  if (weight !== undefined) data.weight = Math.max(0, parseInt(weight));
  if (amount !== undefined) data.amount = Math.max(0, parseInt(amount));
  if (enabled !== undefined) data.enabled = Boolean(enabled);
  if (label !== undefined) data.label = String(label);

  try {
    const updated = await prisma.prizeConfig.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Prize not found' });
  }
});

// GET /api/admin/jackpot
router.get('/jackpot', adminAuth, async (req, res) => {
  const jackpot = await prisma.jackpot.findFirst();
  res.json(jackpot);
});

// PATCH /api/admin/jackpot — update seed, contribution %
router.patch('/jackpot', adminAuth, async (req, res) => {
  const { seed, contribution } = req.body;
  const jackpot = await prisma.jackpot.findFirst();
  if (!jackpot) return res.status(404).json({ error: 'Jackpot not initialised' });

  const data = {};
  if (seed !== undefined) data.seed = Math.max(1, parseInt(seed));
  if (contribution !== undefined) data.contribution = Math.min(100, Math.max(0, parseInt(contribution)));

  const updated = await prisma.jackpot.update({ where: { id: jackpot.id }, data });
  res.json(updated);
});

// GET/PATCH /api/admin/settings — spin cost, etc.
router.get('/settings', adminAuth, async (req, res) => {
  const settings = await prisma.settings.findMany();
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json(map);
});

router.patch('/settings', adminAuth, async (req, res) => {
  const updates = req.body;
  const ops = Object.entries(updates).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    })
  );
  await Promise.all(ops);
  res.json({ ok: true });
});

// GET /api/admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  const [totalSpins, totalUsers, prizeBreakdown] = await Promise.all([
    prisma.spin.count(),
    prisma.user.count(),
    prisma.spin.groupBy({
      by: ['prizeId'],
      _count: { _all: true },
      _sum: { amountWon: true }
    })
  ]);

  const prizeIds = prizeBreakdown.map(p => p.prizeId);
  const configs = await prisma.prizeConfig.findMany({ where: { id: { in: prizeIds } } });
  const configMap = Object.fromEntries(configs.map(c => [c.id, c]));

  const breakdown = prizeBreakdown.map(p => ({
    prize: configMap[p.prizeId]?.label || 'Unknown',
    currency: configMap[p.prizeId]?.currency,
    spins: p._count._all,
    totalWon: p._sum.amountWon
  }));

  res.json({ totalSpins, totalUsers, breakdown });
});

// POST /api/admin/give-gems — gift gems to a user
router.post('/give-gems', adminAuth, async (req, res) => {
  const { username, amount } = req.body;
  if (!username || !amount) return res.status(400).json({ error: 'username and amount required' });

  try {
    const user = await prisma.user.update({
      where: { username },
      data: { gems: { increment: parseInt(amount) } }
    });
    res.json({ username: user.username, gems: user.gems });
  } catch {
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router;
