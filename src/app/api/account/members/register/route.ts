import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AccountMember from '@/models/AccountMember';
import User from '@/models/User';
import { verifyInviteToken } from '@/lib/token';
import { hashPassword, generateToken } from '@/lib/auth';

// Validate an invite and expose immutable registration fields (email, role)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const token = searchParams.get('token');

    if (!memberId || !token) {
      return NextResponse.json({ error: 'memberId and token required' }, { status: 400 });
    }

    await dbConnect();
    const member = await AccountMember.findById(memberId).lean();
    if (!member) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    if (!member.inviteTokenHash || !verifyInviteToken(token, member.inviteTokenHash)) {
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 400 });
    }

    return NextResponse.json({
      email: member.email,
      role: member.role,
      status: member.status,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

// Complete registration: create or link user with immutable email/role, set password
export async function POST(request: NextRequest) {
  try {
    const { memberId, token, password } = await request.json();

    if (!memberId || !token || !password) {
      return NextResponse.json({ error: 'memberId, token and password are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await dbConnect();

    const member = await AccountMember.findById(memberId);
    if (!member) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    if (!member.inviteTokenHash || !verifyInviteToken(token, member.inviteTokenHash)) {
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 400 });
    }

    const email = member.email.toLowerCase();
    // Force invited users to have admin role to ensure scoped access
    const role = 'admin' as const;

    // Create or update user
    let user = await User.findOne({ email }).select('+passwordHash');

    const passwordHash = await hashPassword(password);

    if (!user) {
      // derive a simple name from email prefix
      const nameFromEmail = email.split('@')[0] || 'Manager';
      user = await User.create({
        name: nameFromEmail,
        email,
        passwordHash,
        role,
      });
    } else {
      // If user exists, update password and role to match invite
      user.passwordHash = passwordHash;
      user.role = role;
      await user.save();
    }

    // Link member to user and activate
    member.userId = user._id as any;
    member.status = 'active';
    member.acceptedAt = new Date();
    member.inviteTokenHash = null; // invalidate token after use
    await member.save();

    // Auto-login: return JWT so the app can store it
    const jwt = generateToken({ userId: String(user._id), email: user.email, role: user.role });

    return NextResponse.json({
      success: true,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
      token: jwt,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
