import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest, verifyUserPassword } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const user = await User.findById(auth.userId).select('name email role createdAt updatedAt');
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const body = await request.json();
    const { name, email, currentPassword } = body || {};

    const update: any = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof email === 'string' && email.trim()) update.email = email.trim().toLowerCase();

    // Require password confirmation for email changes
    if (update.email) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required to change email' }, { status: 400 });
      }
      
      const isValidPassword = await verifyUserPassword(auth.userId, currentPassword);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      const existing = await User.findOne({ email: update.email, _id: { $ne: auth.userId } });
      if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(auth.userId, update, { new: true }).select(
      'name email role createdAt updatedAt'
    );
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
