import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/me', verifyToken, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const user = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { id: true, username: true, role: true } });
  res.json({ userId: user?.id, username: user?.username, role: user?.role });
});

router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true }
  });
  res.json(users);
});

router.post('/users', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role },
      select: { id: true, username: true, role: true }
    });
    io.emit('userUpdated');
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const io = req.app.locals.io;
  const id = Number(req.params.id);
  if (req.user?.id === id) return res.status(400).json({ error: 'Cannot delete yourself' });
  
  try {
    await prisma.user.delete({ where: { id } });
    io.emit('userUpdated');
    res.json({ message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password, isAdminLogin } = req.body;
  const prisma = req.app.locals.prisma;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  if (isAdminLogin && user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '2h' });
  
  // Set specific cookie name based on app context
  const cookieName = user.role === 'admin' ? 'sb_admin_token' : 'sb_token';
  res.cookie(cookieName, token, { httpOnly: true, sameSite: 'lax' });
  
  res.json({ message: 'ok', role: user.role, userId: user.id });
});

router.post('/logout', (req, res) => {
  const isAdminRequest = req.headers['x-admin-request'] === 'true';
  if (isAdminRequest) {
    res.clearCookie('sb_admin_token');
  } else {
    res.clearCookie('sb_token');
  }
  res.json({ message: 'logged out' });
});

export default router;
