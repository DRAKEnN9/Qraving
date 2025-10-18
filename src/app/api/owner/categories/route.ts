import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Restaurant from '@/models/Restaurant';
import Subscription from '@/models/Subscription';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';
import { createCategorySchema } from '@/lib/validation';

// GET categories for a restaurant
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

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

    const categories = await Category.find({ restaurantId }).sort({ order: 1 });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create category
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { restaurantId, ...categoryData } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    // Verify ownership (resolve owner for admin managers)
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const validatedData = createCategorySchema.parse(categoryData);

    // Get the highest order number and increment
    const highestOrder = await Category.findOne({ restaurantId }).sort({ order: -1 });
    const order = validatedData.order ?? (highestOrder ? highestOrder.order + 1 : 0);

    const category = await Category.create({
      restaurantId,
      ...validatedData,
      order,
    });

    return NextResponse.json(
      {
        message: 'Category created successfully',
        category,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create category error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
