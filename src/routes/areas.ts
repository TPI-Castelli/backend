import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const areas = await prisma.area.findMany({ include: { bookings: true } });
  const now = new Date();
  const result = areas.map(a=>{
    const activeBookings = a.bookings.filter(b => new Date(b.from) <= now && new Date(b.to) > now).length;
    return { id: a.id, name: a.name, capacity: a.capacity, available: a.capacity - activeBookings };
  });
  res.json(result);
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  const { id, name, capacity } = req.body;
  if (!id || !capacity) return res.status(400).json({ error: 'id and capacity required' });
  try {
    const area = await prisma.area.create({ data: { id, name: name || null, capacity: Number(capacity) } });
    io.emit('bookingUpdated');
    res.status(201).json(area);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  const { id } = req.params;
  const now = new Date();

  try {
    // 1. Terminate all active bookings for this area
    await prisma.booking.updateMany({
      where: { areaId: id, to: { gt: now } },
      data: { to: now }
    });

    // 2. Delete the area
    // The history is preserved because Booking.areaId will become null 
    // and Booking records are NOT deleted (onDelete: SetNull)
    await prisma.area.delete({ where: { id } });

    io.emit('bookingUpdated');
    res.json({ message: 'Area deleted, bookings expired but history preserved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
