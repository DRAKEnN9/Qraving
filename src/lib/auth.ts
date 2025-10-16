import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import dbConnect from './mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get user from request (from Authorization header or cookie)
 */
export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  // Try cookie
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

/**
 * Middleware to protect API routes
 */
export function requireAuth(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const user = getUserFromRequest(request);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Attach user to request for use in handler
    (request as any).user = user;

    return handler(request, context);
  };
}

/**
 * Middleware to require owner role
 */
export function requireOwner(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'owner') {
      return Response.json({ error: 'Forbidden - Owner access required' }, { status: 403 });
    }

    (request as any).user = user;

    return handler(request, context);
  };
}

/**
 * Verify user's current password for sensitive operations
 */
export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  try {
    await dbConnect();
    const user = await User.findById(userId).select('passwordHash');
    if (!user || !user.passwordHash) {
      return false;
    }
    return comparePassword(password, user.passwordHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
