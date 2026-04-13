import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth';
import areasRouter from './routes/areas';
import bookingsRouter from './routes/bookings';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/areas', areasRouter);
app.use('/api/bookings', bookingsRouter);

app.locals.prisma = prisma;

const port = process.env.PORT || 4000;

async function start() {
  await prisma.$connect();
  app.listen(port, () =>
    console.log(`Backend listening on http://localhost:${port}`)
  );
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
