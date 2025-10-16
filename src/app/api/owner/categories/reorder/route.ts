import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Restaurant from '@/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';

// POST /api/owner/categories/reorder - Reorder categories
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { restaurantId, categories } = body;

    if (!restaurantId || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Verify restaurant ownership for effective owner (owner or mapped from admin)
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      ownerId,
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update order for each category
    const updatePromises = categories.map((cat: { id: string; order: number }) =>
      Category.findByIdAndUpdate(cat.id, { order: cat.order })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Categories reordered successfully',
    });
  } catch (error: any) {
    console.error('Reorder categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
