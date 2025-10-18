import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import Restaurant from '@/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';
import { updateMenuItemSchema } from '@/lib/validation';
import Category from '@/models/Category';

// GET single menu item
export const dynamic = 'force-dynamic';

export async function GET(
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

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Verify ownership
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const restaurant = await Restaurant.findOne({
      _id: menuItem.restaurantId,
      ownerId,
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ menuItem });
  } catch (error) {
    console.error('Get menu item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update menu item
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

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Verify ownership (resolve owner for admin managers)
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const restaurant = await Restaurant.findOne({
      _id: menuItem.restaurantId,
      ownerId,
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMenuItemSchema.parse(body);

    // If categoryId provided, ensure it belongs to this restaurant
    if (validatedData.categoryId && String(validatedData.categoryId) !== String(menuItem.categoryId)) {
      const targetCategory = await Category.findOne({
        _id: validatedData.categoryId,
        restaurantId: menuItem.restaurantId,
      });
      if (!targetCategory) {
        return NextResponse.json({ error: 'Target category not found' }, { status: 404 });
      }
      // If order not provided, append to end of target category
      if (validatedData.order === undefined) {
        const highest = await MenuItem.findOne({
          restaurantId: menuItem.restaurantId,
          categoryId: validatedData.categoryId,
        }).sort({ order: -1 });
        (validatedData as any).order = highest ? highest.order + 1 : 0;
      }
    }

    Object.assign(menuItem, validatedData);
    await menuItem.save();

    // Emit real-time update so dashboards and customer menus can react (soldOut, etc.)
    try {
      if ((global as any).io) {
        (global as any).io
          .to(`restaurant:${menuItem.restaurantId}`)
          .emit('menu-item-updated', {
            itemId: String(menuItem._id),
            restaurantId: String(menuItem.restaurantId),
            categoryId: String(menuItem.categoryId),
            soldOut: menuItem.soldOut,
            orderable: menuItem.orderable,
            name: menuItem.name,
            priceCents: menuItem.priceCents,
            images: menuItem.images,
            description: menuItem.description,
            modifiers: menuItem.modifiers,
          });
      }
    } catch (e) {
      console.warn('Socket emit failed (menu-item-updated):', e);
    }

    return NextResponse.json({
      message: 'Menu item updated successfully',
      menuItem,
    });
  } catch (error: any) {
    console.error('Update menu item error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE menu item
export async function DELETE(
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

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Verify ownership (resolve owner for admin managers)
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const restaurant = await Restaurant.findOne({
      _id: menuItem.restaurantId,
      ownerId,
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await menuItem.deleteOne();

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
