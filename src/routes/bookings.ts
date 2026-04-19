import { Router } from 'express';
import { verifyToken, requireRole, ensureSameUserOrAdmin } from '../middleware/auth';

const router = Router();

router.post('/', verifyToken, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  const userId = req.user!.id;
  const { areaId } = req.body;
  const now = new Date();
  
  const area = await prisma.area.findUnique({ where: { id: areaId } });
  if (!area) return res.status(404).json({ error: 'Area not found' });

  const durationMinutes = parseInt(process.env.BOOKING_DURATION_MINUTES || '60', 10);
  console.log('DEBUG: BOOKING_DURATION_MINUTES is:', process.env.BOOKING_DURATION_MINUTES);
  console.log('DEBUG: Parsed durationMinutes is:', durationMinutes);
  
  const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);
  
  const booking = await prisma.booking.create({ 
    data: { 
      userId: Number(userId), 
      areaId, 
      areaName: area.name || area.id,
      from: now, 
      to: expires 
    } 
  });
  
  io.emit('bookingUpdated');

  const timeToWait = expires.getTime() - Date.now();
  if (timeToWait > 0) {
    setTimeout(() => {
      io.emit('bookingUpdated');
    }, timeToWait);
  }
  
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
  const bookings = await prisma.booking.findMany({ where: { createdAt: { gte: from } } });

  const stats: Record<string, Record<string, number>> = {};
  bookings.forEach(b => {
    const day = new Date(b.createdAt).toISOString().slice(0,10);
    const identifier = b.areaName || b.areaId || 'Area Eliminata';
    stats[day] = stats[day] || {};
    stats[day][identifier] = (stats[day][identifier] || 0) + 1;
  });

  res.json(stats);
});

router.get('/trend/7days', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({ 
    where: { createdAt: { gte: from } },
    orderBy: { createdAt: 'asc' }
  });

  // Get current areas for initial data structure
  const currentAreas = await prisma.area.findMany();
  // Get all unique area identifiers from the bookings history to include deleted areas in trend
  const historicalIdentifiers = Array.from(new Set(bookings.map(b => b.areaId).filter(Boolean))) as string[];
  
  const data: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry: any = { date: dateStr };
    // Initialize all known areas (current + historical) to 0
    currentAreas.forEach(a => entry[a.id] = 0);
    historicalIdentifiers.forEach(id => entry[id] = 0);
    data.push(entry);
  }

  bookings.forEach(b => {
    const day = new Date(b.createdAt).toISOString().slice(0, 10);
    const entry = data.find(d => d.date === day);
    if (entry && b.areaId) {
      entry[b.areaId] = (entry[b.areaId] || 0) + 1;
    }
  });

  res.json(data);
});

router.post('/management/expire-all', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  const now = new Date();
  
  await prisma.booking.updateMany({
    where: { to: { gt: now } },
    data: { to: now }
  });
  
  io.emit('bookingUpdated');
  res.json({ message: 'All active bookings expired' });
});

router.post('/management/clear-history', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  
  await prisma.booking.deleteMany({});
  
  io.emit('bookingUpdated');
  res.json({ message: 'All booking history cleared' });
});

export default router;
