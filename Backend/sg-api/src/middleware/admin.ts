import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './auth.js';

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'Administrator') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
