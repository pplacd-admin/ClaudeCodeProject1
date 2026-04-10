import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    if (!adminAuth) {
      // Dev mode without Firebase: accept any token and use it as userId
      req.userId = token.substring(0, 28) || 'dev-user';
      next();
      return;
    }
    const decoded = await adminAuth.verifyIdToken(token);
    req.userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
