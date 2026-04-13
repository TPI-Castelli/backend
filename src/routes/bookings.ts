import { Router } from 'express';
import { verifyToken, requireRole, ensureSameUserOrAdmin } from '../middleware/auth';

const router = Router();

router.post('/', verifyToken, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user!.id;
  const { areaId } = req.body;
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
  const booking = await prisma.booking.create({ data: { userId: Number(userId), areaId, from: now, to: expires } });
  res.json(booking);
});

router.get('/my/:userId', verifyToken, ensureSameUserOrAdmin, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  const bookings = await prisma.booking.findMany({ where: { userId }, include: { area: true } });
  res.json(bookings);
});

router.get('/all', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const bookings = await prisma.booking.findMany({ include: { area: true, user: true } });
  res.json(bookings);
});

router.get('/stats/30days', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({ where: { createdAt: { gte: from } }, include: { area: true } });

  // group by day and area
  const stats: Record<string, Record<string, number>> = {};
  bookings.forEach(b => {
    const day = new Date(b.createdAt).toISOString().slice(0,10);
    stats[day] = stats[day] || {};
    stats[day][b.areaId] = (stats[day][b.areaId] || 0) + 1;
  });

  res.json(stats);
});

export default router;
