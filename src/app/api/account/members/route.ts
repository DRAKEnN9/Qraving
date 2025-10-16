import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest, verifyUserPassword } from '@/lib/auth';
import { resolveAccountOwnerPrivilege } from '@/lib/ownership';
import AccountMember from '@/models/AccountMember';
import User from '@/models/User';
import { generateInviteToken } from '@/lib/token';
import { sendEmail } from '@/lib/email';

// List members
export async function GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerId = await resolveAccountOwnerPrivilege(auth);
    if (!ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const members = await AccountMember.find({ ownerId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ members });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

// Invite member
export async function POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const ownerId = await resolveAccountOwnerPrivilege(auth);
    if (!ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const { email } = await request.json();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    // Always invite as admin; never allow inviting 'owner'
    const normalizedRole: 'admin' = 'admin';

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    const { token, hash } = generateInviteToken();

    const member = await AccountMember.findOneAndUpdate(
      { ownerId, email: normalizedEmail },
      {
        ownerId,
        email: normalizedEmail,
        role: normalizedRole,
        status: existingUser ? 'invited' : 'invited',
        inviteTokenHash: hash,
        invitedAt: new Date(),
        userId: existingUser ? existingUser._id : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/invite/register?memberId=${encodeURIComponent(String(member._id))}&token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

    try {
      // Fire-and-forget email (best-effort). If email not configured, it will log.
      const subject = `You're invited to manage an account on QR Menu Manager`;
      const roleLabel = 'Manager';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto">
          <h2 style="color:#0ea5e9;">Invitation to join</h2>
          <p>You have been invited as <strong>${roleLabel}</strong> to help manage a restaurant on <strong>QR Menu Manager</strong>.</p>
          <p>Your invite email: <strong>${normalizedEmail}</strong></p>
          <p style="margin:24px 0">
            <a href="${link}"
              style="background:#10b981;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;display:inline-block">
              Accept Invite & Create Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break:break-all;color:#334155">${link}</p>
          <p style="color:#64748b;font-size:12px">If you didn't expect this, you can safely ignore this email.</p>
        </div>
      `;
      await sendEmail({ to: normalizedEmail, subject, html, text: `You're invited to manage an account. Open: ${link}` });
    } catch (e) {
      // Do not fail the invite if email fails; the link is returned to the client.
      console.warn('Invite email send failed:', e);
    }

    return NextResponse.json({ member, inviteLink: link });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

// Update role
export async function PATCH(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const ownerId = await resolveAccountOwnerPrivilege(auth);
    if (!ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const body = await request.json();
    const memberId: string | undefined = body.memberId;
    const role: 'owner' | 'admin' | undefined = body.role;
    const currentPassword: string | undefined = body.currentPassword;

    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });
    if (role !== 'owner' && role !== 'admin') return NextResponse.json({ error: 'Valid role required' }, { status: 400 });
    if (!currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 });

    // Verify owner's current password
    const ok = await verifyUserPassword(auth.userId, currentPassword);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const updated = await AccountMember.findOneAndUpdate(
      { _id: memberId, ownerId },
      { role },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ member: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

// Remove member
export async function DELETE(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const ownerId = await resolveAccountOwnerPrivilege(auth);
    if (!ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });

    const removed = await AccountMember.findOneAndDelete({ _id: memberId, ownerId });
    if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Optionally delete the linked user if they are a manager (admin) and not the owner
    try {
      if (removed.userId) {
        const user = await User.findById(removed.userId);
        const isOwnerUser = String(removed.userId) === String(auth.userId);
        if (user && user.role === 'admin' && !isOwnerUser) {
          // Ensure this user isn't linked to any other accounts before deletion
          const otherLinks = await AccountMember.countDocuments({ userId: removed.userId });
          if (otherLinks === 0) {
            await User.findByIdAndDelete(removed.userId);
          }
        }
      }
    } catch (err) {
      console.warn('Warning: failed to cleanup user after member removal:', err);
    }

    // Notify removed user in real-time via Socket.io (if they have ever registered)
    try {
      if ((global as any).io && removed.userId) {
        (global as any).io.to(`user:${removed.userId}`).emit('member-removed', {
          ownerId: String(removed.ownerId),
          removedAt: new Date().toISOString(),
          reason: 'Removed by owner',
        });
      }
    } catch (e) {
      console.warn('Warning: failed to emit member-removed event:', e);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
