const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let io = null;

function initJackpotSocket(socketIo) {
  io = socketIo;
  io.on('connection', async (socket) => {
    const jackpot = await getJackpot();
    socket.emit('jackpot_update', jackpot.amount);
  });
}

async function getJackpot() {
  let jackpot = await prisma.jackpot.findFirst();
  if (!jackpot) jackpot = await prisma.jackpot.create({ data: {} });
  return jackpot;
}

async function contributeToJackpot(spinCostGems) {
  const jackpot = await getJackpot();
  const contribution = Math.ceil((spinCostGems * jackpot.contribution) / 100);
  const updated = await prisma.jackpot.update({
    where: { id: jackpot.id },
    data: { amount: { increment: contribution } }
  });
  if (io) io.emit('jackpot_update', updated.amount);
  return updated;
}

async function claimJackpot() {
  const jackpot = await getJackpot();
  const wonAmount = jackpot.amount;
  const reset = await prisma.jackpot.update({
    where: { id: jackpot.id },
    data: { amount: jackpot.seed, lastWonAt: new Date() }
  });
  if (io) io.emit('jackpot_update', reset.amount);
  return wonAmount;
}

module.exports = { initJackpotSocket, getJackpot, contributeToJackpot, claimJackpot };
