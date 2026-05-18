const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

const PACKAGES = {
  etb_3:     { gems: 30,  coinCost: 0,     label: '3 ETB'  },
  etb_5:     { gems: 50,  coinCost: 0,     label: '5 ETB'  },
  etb_10:    { gems: 100, coinCost: 0,     label: '10 ETB' },
  coins_50k: { gems: 50,  coinCost: 50000, label: '50,000 Coins' },
};

// GET /api/shop/packages
router.get('/packages', (req, res) => {
  res.json(PACKAGES);
});

// POST /api/shop/buy  { packageId }
router.post('/buy', auth, async (req, res) => {
  const { packageId } = req.body;
  const pkg = PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ error: 'Unknown package' });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (pkg.coinCost > 0 && user.coins < pkg.coinCost) {
      return res.status(400).json({ error: `Not enough coins (need ${pkg.coinCost.toLocaleString()})` });
    }

    const updateData = { gems: { increment: pkg.gems } };
    if (pkg.coinCost > 0) updateData.coins = { decrement: pkg.coinCost };

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { coins: true, gems: true }
    });

    res.json({ gems: pkg.gems, balance: updated });
  } catch {
    res.status(500).json({ error: 'Purchase failed' });
  }
});

module.exports = router;
