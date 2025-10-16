import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function generateInviteToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(24).toString('hex');
  const hash = bcrypt.hashSync(token, 10);
  return { token, hash };
}

export function verifyInviteToken(token: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(token, hash);
  } catch {
    return false;
  }
}
