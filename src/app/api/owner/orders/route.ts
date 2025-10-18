import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import Subscription from '@/models/Subscription';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';

// GET orders for owner's restaurant
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    await dbConnect();

    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Require active or trialing subscription
    const sub = await Subscription.findOne({ ownerId });
    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
    }

    // If restaurantId missing, fallback to owner's first restaurant
    if (!restaurantId) {
      const firstRestaurant = await Restaurant.findOne({ ownerId }).sort({ createdAt: 1 }).lean();
      if (!firstRestaurant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }
      restaurantId = String(firstRestaurant._id);
    }

    // Verify ownership
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Build query
    const query: any = { restaurantId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get orders (lean for serialization) and normalize shape
    const docs = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const orders = docs.map((o: any) => ({
      _id: String(o._id),
      orderNumber: String(o._id).slice(-8).toUpperCase(),
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone || undefined,
      tableNumber: o.tableNumber,
      status: o.status === 'ready' ? 'preparing' : o.status,
      items: Array.isArray(o.items)
        ? o.items.map((it: any) => ({
            menuItemId: String(it.menuItemId),
            name: it.name,
            quantity: it.quantity,
            priceCents: it.priceCents,
            // Coerce modifiers to objects if stored as strings
            modifiers: Array.isArray(it.modifiers)
              ? it.modifiers.map((m: any) =>
                  typeof m === 'string' ? { name: m, priceDelta: 0 } : m
                )
              : [],
          }))
        : [],
      totalCents: o.totalCents,
      notes: o.notes || undefined,
      createdAt: o.createdAt,
    }));

    // Get total count
    const totalCount = await Order.countDocuments(query);

    return NextResponse.json({
      orders,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + orders.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
