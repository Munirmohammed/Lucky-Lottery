const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const { selectPrize } = require('../services/prizeEngine');
const { contributeToJackpot, claimJackpot } = require('../services/jackpot');

const prisma = new PrismaClient();

const spinLimiter = rateLimit({
  windowMs: 3000,
  max: 1,
  message: { error: 'One spin at a time, please wait' }
});

async function getSpinCost() {
  const setting = await prisma.settings.findUnique({ where: { key: 'spin_cost_gems' } });
  return setting ? parseInt(setting.value) : 10;
}

// POST /api/game/spin — deducts gems, picks prize, returns result
router.post('/spin', auth, spinLimiter, async (req, res) => {
  const userId = req.user.id;

  try {
    const [user, spinCost] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      getSpinCost()
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.gems < spinCost) return res.status(400).json({ error: 'Not enough gems' });

    const prize = await selectPrize();
    await contributeToJackpot(spinCost);

    let amountWon = prize.amount;
    let currency = prize.currency;

    if (prize.currency === 'jackpot') {
      amountWon = await claimJackpot();
      currency = 'coins';
    }

    // Build atomic update — can't put both decrement+increment on same field
    const updateData = {};
    if (currency === 'gems') {
      // Net change: prize earned minus spin cost
      const net = amountWon - spinCost;
      updateData.gems = net >= 0 ? { increment: net } : { decrement: -net };
    } else {
      updateData.gems = { decrement: spinCost };
      if (currency === 'coins') updateData.coins = { increment: amountWon };
      // try_again: only the decrement above, no credit
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: updateData }),
      prisma.spin.create({
        data: { userId, prizeId: prize.id, amountWon, currency, gemsCost: spinCost }
      })
    ]);

    res.json({
      prize: { ...prize, amount: amountWon, currency },
      won: currency !== 'try_again',
      balance: { coins: updatedUser.coins, gems: updatedUser.gems }
    });
  } catch (err) {
    console.error('Spin error:', err);
    res.status(500).json({ error: 'Spin failed' });
  }
});

// GET /api/game/spin-cost
router.get('/spin-cost', auth, async (req, res) => {
  const cost = await getSpinCost();
  res.json({ cost });
});

// GET /api/game/prizes — list all enabled prizes for UI (excludes try_again)
router.get('/prizes', async (req, res) => {
  const prizes = await prisma.prizeConfig.findMany({
    where: { enabled: true, NOT: { currency: 'try_again' } }
  });
  res.json(prizes);
});

module.exports = router;
