import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { resolveAccountRole, resolveEffectiveOwnerId } from '@/lib/ownership';

export async function GET(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(userPayload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const account = await resolveAccountRole(userPayload);
    const effectiveOwnerId = await resolveEffectiveOwnerId(userPayload);

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountRole: account?.role || (user.role === 'owner' ? 'owner' : 'admin'),
        effectiveOwnerId: account?.ownerId || effectiveOwnerId || String(user._id),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
