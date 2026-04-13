import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import areasRouter from './routes/areas';
import bookingsRouter from './routes/bookings';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/areas', areasRouter);
app.use('/api/bookings', bookingsRouter);

app.locals.prisma = prisma;

app.listen(4000, () => console.log('Backend listening on http://localhost:4000'));
