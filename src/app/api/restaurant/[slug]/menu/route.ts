import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import Category from '@/models/Category';
import MenuItem from '@/models/MenuItem';

// GET public menu for a restaurant (no auth required)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Get categories
    const categories = await Category.find({ restaurantId: restaurant._id }).sort({ order: 1 });

    // Get menu items that are orderable
    const menuItems = await MenuItem.find({
      restaurantId: restaurant._id,
      orderable: true,
    }).sort({ order: 1 });

    // Group items by category
    const categoriesWithItems = categories.map((category) => {
      const categoryObj = category.toObject();
      return {
        ...categoryObj,
        _id: String(categoryObj._id),
        items: menuItems
          .filter((item) => String(item.categoryId) === String(category._id))
          .map((item) => {
            const itemObj = item.toObject();
            return {
              ...itemObj,
              _id: String(itemObj._id),
            };
          }),
      };
    });

    return NextResponse.json({
      restaurant: {
        id: String(restaurant._id),
        name: restaurant.name,
        logoUrl: restaurant.logoUrl,
        tableNumber: restaurant.tableNumber,
        settings: restaurant.settings,
      },
      categories: categoriesWithItems,
    });
  } catch (error) {
    console.error('Get public menu error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
