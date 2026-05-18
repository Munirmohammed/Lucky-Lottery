require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const { initJackpotSocket } = require('./services/jackpot');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

initJackpotSocket(io);

async function seedPrizes() {
  const count = await prisma.prizeConfig.count();
  if (count > 0) return;

  await prisma.prizeConfig.createMany({
    data: [
      { name: 'try_again',  label: 'Try Again', amount: 0,    currency: 'try_again', weight: 82 },
      { name: '500_coins',  label: '500',        amount: 500,  currency: 'coins',    weight: 9  },
      { name: '10_gems',    label: '10',         amount: 10,   currency: 'gems',     weight: 5  },
      { name: '2000_coins', label: '2,000',      amount: 2000, currency: 'coins',    weight: 2  },
      { name: '5000_coins', label: '5,000',      amount: 5000, currency: 'coins',    weight: 1  },
      { name: 'jackpot',    label: 'JACKPOT',    amount: 0,    currency: 'jackpot',  weight: 1  },
    ]
  });

  await prisma.jackpot.create({ data: {} });
  console.log('Default prizes seeded');
}

server.listen(PORT, async () => {
  await seedPrizes();
  console.log(`Lucky Lottery server running on port ${PORT}`);
});

module.exports = { io, prisma };
