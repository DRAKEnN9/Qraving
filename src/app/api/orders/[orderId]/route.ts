import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await dbConnect();
    const { orderId } = await params;

    const orderDoc = await Order.findById(orderId).lean();
    if (!orderDoc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const restaurant = await Restaurant.findById(orderDoc.restaurantId)
      .select('name slug logoUrl')
      .lean();

    const order = {
      _id: String(orderDoc._id),
      orderNumber: String(orderDoc._id).slice(-8).toUpperCase(),
      customerName: orderDoc.customerName,
      customerEmail: orderDoc.customerEmail,
      customerPhone: orderDoc.customerPhone || undefined,
      tableNumber: orderDoc.tableNumber,
      status: orderDoc.status,
      items: orderDoc.items,
      totalCents: orderDoc.totalCents,
      currency: orderDoc.currency,
      notes: orderDoc.notes || undefined,
      createdAt: orderDoc.createdAt,
      restaurant: restaurant
        ? {
            _id: String(restaurant._id),
            name: restaurant.name as string,
            slug: restaurant.slug as string,
            logo: (restaurant as any).logoUrl || undefined,
          }
        : { _id: '', name: 'Unknown', slug: '', logo: undefined },
    };

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
