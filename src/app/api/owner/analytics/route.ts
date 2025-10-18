import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import Subscription from '@/models/Subscription';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';

// GET analytics for owner's restaurant
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    await dbConnect();

    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Require active or trialing subscription
    const sub = await Subscription.findOne({ ownerId });
    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
    }

    // Verify ownership
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all orders in date range (for counts and status distribution)
    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: startDate },
    });

    // Revenue should only consider completed orders
    const completedOrders = orders.filter((o) => o.status === 'completed');

    // Previous period metrics (same length immediately before startDate)
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevOrders = await Order.find({
      restaurantId,
      createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    });
    const prevCompleted = prevOrders.filter((o) => o.status === 'completed');

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Count orders by status
    const ordersByStatus = orders.reduce((acc: any, order) => {
      const raw = (order as any).status as string;
      const key = raw === 'ready' ? 'preparing' : raw;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const prevOrdersByStatus = prevOrders.reduce((acc: any, order) => {
      const raw = (order as any).status as string;
      const key = raw === 'ready' ? 'preparing' : raw;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Popular items (based on completed orders) and real revenue incl. modifiers
    const itemCounts: { [key: string]: { name: string; count: number; revenue: number } } = {};

    completedOrders.forEach((order) => {
      order.items.forEach((item: any) => {
        const key = item.menuItemId.toString();
        if (!itemCounts[key]) {
          itemCounts[key] = { name: item.name, count: 0, revenue: 0 };
        }
        const modifiersTotal = Array.isArray(item.modifiers)
          ? item.modifiers.reduce((s: number, m: any) => s + (m?.priceDelta || 0), 0)
          : 0;
        const lineTotal = (item.priceCents + modifiersTotal) * item.quantity;
        itemCounts[key].count += item.quantity;
        itemCounts[key].revenue += lineTotal;
      });
    });

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Revenue by day
    const revenueByDay: { [key: string]: number } = {};
    completedOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + order.totalCents;
    });

    const dailyRevenue = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Peak hours (only for pro tier)
    let peakHours: any[] = [];
    // TODO: Check subscription tier
    const isPro = false; // Placeholder

    if (isPro) {
      const hourCounts: { [key: number]: number } = {};
      orders.forEach((order) => {
        const hour = order.createdAt.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), orders: count }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);
    }

    return NextResponse.json({
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      metrics: {
        totalOrders,
        totalRevenue: totalRevenue,
        averageOrderValue,
        ordersByStatus,
      },
      previous: {
        totalOrders: prevOrders.length,
        totalRevenue: prevCompleted.reduce((s, o) => s + o.totalCents, 0),
        averageOrderValue:
          prevCompleted.length > 0
            ? prevCompleted.reduce((s, o) => s + o.totalCents, 0) / prevCompleted.length
            : 0,
        ordersByStatus: prevOrdersByStatus,
      },
      topItems,
      dailyRevenue,
      peakHours: isPro ? peakHours : null,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
