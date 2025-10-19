import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get user from JWT token
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user with password hash
    await User.findByIdAndUpdate(user.userId, {
      passwordHash
    });

    return NextResponse.json({
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
