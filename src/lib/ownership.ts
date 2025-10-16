import dbConnect from '@/lib/mongodb';
import AccountMember from '@/models/AccountMember';
import type { TokenPayload } from '@/lib/auth';

/**
 * Resolves the effective ownerId for an authenticated user.
 * - Owners map to their own userId
 * - Admin managers map to the ownerId of the AccountMember they belong to
 *   (latest accepted membership wins if multiple)
 */
export async function resolveEffectiveOwnerId(user: TokenPayload | null): Promise<string | null> {
  if (!user) return null;
  if (user.role === 'owner') return user.userId;

  if (user.role === 'admin') {
    await dbConnect();
    const membership = await AccountMember.findOne({ userId: user.userId, status: 'active' })
      .sort({ acceptedAt: -1, createdAt: -1 })
      .lean();
    return membership ? String(membership.ownerId) : null;
  }

  return null;
}

/**
 * Resolve account-level OWNER privilege.
 * Returns the account owner's userId if the authenticated user can act as an owner for that account.
 * - Global owners: returns their own userId
 * - Admins: returns mapped ownerId only when their AccountMember.role === 'owner' and status === 'active'
 */
export async function resolveAccountOwnerPrivilege(user: TokenPayload | null): Promise<string | null> {
  if (!user) return null;
  if (user.role === 'owner') return user.userId;

  if (user.role === 'admin') {
    await dbConnect();
    const membership = await AccountMember.findOne({ userId: user.userId, status: 'active' })
      .sort({ acceptedAt: -1, createdAt: -1 })
      .lean();
    if (!membership) return null;
    return membership.role === 'owner' ? String(membership.ownerId) : null;
  }
  return null;
}

/**
 * Resolve the user's account-level role on their current account context.
 * - Global owners => { ownerId: user.userId, role: 'owner' }
 * - Admins => maps to latest active membership and returns that membership's role with the mapped ownerId
 */
export async function resolveAccountRole(user: TokenPayload | null): Promise<{ ownerId: string; role: 'owner' | 'admin' } | null> {
  if (!user) return null;
  if (user.role === 'owner') return { ownerId: user.userId, role: 'owner' };

  if (user.role === 'admin') {
    await dbConnect();
    const membership = await AccountMember.findOne({ userId: user.userId, status: 'active' })
      .sort({ acceptedAt: -1, createdAt: -1 })
      .lean();
    if (!membership) return null;
    return { ownerId: String(membership.ownerId), role: membership.role as 'owner' | 'admin' };
  }
  return null;
}
