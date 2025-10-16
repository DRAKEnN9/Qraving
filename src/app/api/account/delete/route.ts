import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest, verifyUserPassword } from '@/lib/auth';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Subscription from '@/models/Subscription';
import AccountMember from '@/models/AccountMember';

export async function DELETE(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'owner') return NextResponse.json({ error: 'Only owner can delete account' }, { status: 403 });

    const body = await request.json();
    const { currentPassword } = body || {};
    
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password required to delete account' }, { status: 400 });
    }

    await dbConnect();
    
    // Verify password before proceeding with deletion
    const isValidPassword = await verifyUserPassword(auth.userId, currentPassword);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Delete restaurants and their orders
    const restaurants = await Restaurant.find({ ownerId: auth.userId }, { _id: 1 }).lean();
    const restaurantIds = restaurants.map((r: any) => r._id);
    if (restaurantIds.length > 0) {
      await Order.deleteMany({ restaurantId: { $in: restaurantIds } });
      await Restaurant.deleteMany({ _id: { $in: restaurantIds } });
    }

    // Delete subscription and members
    await Subscription.deleteOne({ ownerId: auth.userId });
    await AccountMember.deleteMany({ ownerId: auth.userId });

    // Delete user
    await User.deleteOne({ _id: auth.userId });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Delete account error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
