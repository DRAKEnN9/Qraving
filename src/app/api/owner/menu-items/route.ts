import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import Restaurant from '@/models/Restaurant';
import Category from '@/models/Category';
import Subscription from '@/models/Subscription';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';
import { createMenuItemSchema } from '@/lib/validation';

// GET menu items for a restaurant
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const categoryId = searchParams.get('categoryId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Resolve owner for admin managers
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

    const query: any = { restaurantId };
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const menuItems = await MenuItem.find(query).sort({ order: 1 });

    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error('Get menu items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create menu item
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { restaurantId, ...itemData } = body;

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

    const validatedData = createMenuItemSchema.parse(itemData);

    // Verify category exists and belongs to restaurant
    const category = await Category.findOne({
      _id: validatedData.categoryId,
      restaurantId,
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get the highest order number and increment
    const highestOrder = await MenuItem.findOne({
      restaurantId,
      categoryId: validatedData.categoryId,
    }).sort({ order: -1 });
    const order = validatedData.order ?? (highestOrder ? highestOrder.order + 1 : 0);

    const menuItem = await MenuItem.create({
      restaurantId,
      ...validatedData,
      order,
    });

    return NextResponse.json(
      {
        message: 'Menu item created successfully',
        menuItem,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create menu item error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
