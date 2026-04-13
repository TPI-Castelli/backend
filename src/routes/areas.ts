import { Router } from 'express';
import { verifyToken } from '../middleware/auth';

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

export default router;
