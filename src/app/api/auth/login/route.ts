import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user with password hash
    const user = await User.findOne({ email: validatedData.email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await comparePassword(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
