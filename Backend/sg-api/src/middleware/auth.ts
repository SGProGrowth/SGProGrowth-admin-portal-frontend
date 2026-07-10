import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { JwtClaims } from '../types.js';

export interface AuthedRequest extends Request {
  user?: JwtClaims;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }) as JwtClaims;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(user: { email: string; name: string; role: string }) {
  return jwt.sign(
    { email: user.email, name: user.name, role: user.role },
    config.jwtSecret,
    {
      subject: user.email,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      expiresIn: '8h',
    },
  );
}
