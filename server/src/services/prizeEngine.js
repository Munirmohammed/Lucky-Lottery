const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Weighted random selection from enabled prize tiers.
 * Weights are admin-configurable integers; higher = more likely.
 */
async function selectPrize() {
  const prizes = await prisma.prizeConfig.findMany({ where: { enabled: true } });
  if (!prizes.length) throw new Error('No prizes configured');

  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const prize of prizes) {
    rand -= prize.weight;
    if (rand <= 0) return prize;
  }

  return prizes[prizes.length - 1];
}

module.exports = { selectPrize };
