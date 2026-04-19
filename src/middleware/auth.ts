import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string }
    }
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  // If the frontend explicitly marks this as an admin request, prioritize admin token
  const isAdminRequest = req.headers['x-admin-request'] === 'true';
  const token = isAdminRequest 
    ? req.cookies?.sb_admin_token 
    : (req.cookies?.sb_token || req.cookies?.sb_admin_token);
  
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as any;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the current user session matches the required role
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    // Explicitly check role: if a user is using a non-admin token for admin routes, reject it
    if (req.user.role === role) return next();
    
    // If token is valid but role doesn't match
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  };
}

export function ensureSameUserOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userIdParam = Number(req.params.userId);
  if (req.user.role === 'admin' || req.user.id === userIdParam) return next();
  return res.status(403).json({ error: 'Forbidden' });
}
