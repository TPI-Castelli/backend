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
  const { id, name, capacity } = req.body;
  if (!id || !capacity) return res.status(400).json({ error: 'id and capacity required' });
  try {
    const area = await prisma.area.create({ data: { id, name: name || null, capacity: Number(capacity) } });
    res.status(201).json(area);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
