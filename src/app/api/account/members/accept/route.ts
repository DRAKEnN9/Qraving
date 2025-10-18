import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import AccountMember from '@/models/AccountMember';
import { verifyInviteToken } from '@/lib/token';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId, token } = await request.json();
    if (!memberId || !token) return NextResponse.json({ error: 'memberId and token required' }, { status: 400 });

    await dbConnect();

    const member = await AccountMember.findById(memberId);
    if (!member) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    if (!member.inviteTokenHash || !verifyInviteToken(token, member.inviteTokenHash)) {
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 400 });
    }

    // Ensure the logged-in user's email matches the invited email
    if (member.email.toLowerCase() !== String(auth.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'This invite is not for your account email' }, { status: 403 });
    }

    member.status = 'active';
    member.acceptedAt = new Date();
    member.userId = auth.userId as any;
    member.inviteTokenHash = null;
    await member.save();

    return NextResponse.json({ success: true, member });
  } catch (e: any) {
    console.error('Accept invite error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
