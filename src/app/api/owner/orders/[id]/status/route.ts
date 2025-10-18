import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';
import { updateOrderStatusSchema } from '@/lib/validation';

// PATCH update order status
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership using effective owner (owner or mapped from admin)
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const restaurant = await Restaurant.findOne({
      _id: order.restaurantId,
      ownerId,
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    // Update status
    order.status = validatedData.status;
    await order.save();


    // Emit real-time notification via Socket.io
    if (global.io) {
      const orderUpdateData = {
        orderId: String(order._id),
        orderNumber: String(order._id).slice(-8).toUpperCase(),
        status: order.status,
      };

      // Notify restaurant staff
      global.io.to(`restaurant:${order.restaurantId}`).emit('order-status-updated', orderUpdateData);
      
      // Notify customer waiting for this specific order
      global.io.to(`order:${String(order._id)}`).emit('order-status-updated', orderUpdateData);
      
      console.log(`Socket.io notifications sent for order ${String(order._id)} status: ${order.status}`);
    }

    return NextResponse.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
