import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const prisma = req.app.locals.prisma;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '2h' });
  res.cookie('token', token, { httpOnly: true });
  res.json({ message: 'ok', role: user.role, userId: user.id });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'logged out' });
});

export default router;
