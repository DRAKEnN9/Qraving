import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import Category from '@/models/Category';
import MenuItem from '@/models/MenuItem';

// GET public menu for a restaurant (no auth required)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const { slug } = params;
    const normalizedSlug = (slug || '').toString().trim().toLowerCase();

    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({ slug: normalizedSlug }).lean();
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Get categories for this restaurant
    const categories = await Category.find({ restaurantId: restaurant._id })
      .sort({ order: 1 })
      .lean();

    // Get all menu items for this restaurant
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id })
      .sort({ order: 1 })
      .lean();

    // Group items by category
    const categoriesWithItems = categories.map((category) => ({
      _id: String(category._id),
      name: category.name,
      items: menuItems
        .filter((item) => String(item.categoryId) === String(category._id))
        .map((item) => ({
          _id: String(item._id),
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          images: item.images || [],
          orderable: item.orderable,
          soldOut: item.soldOut,
          modifiers: item.modifiers || [],
        })),
    }));

    return NextResponse.json({
      restaurant: {
        _id: String(restaurant._id),
        name: restaurant.name,
        slug: restaurant.slug,
        logo: (restaurant as any).logoUrl,
        address: restaurant.address,
        tableNumber: (restaurant as any).tableNumber,
        currency: (restaurant as any).settings?.currency || 'INR',
      },
      categories: categoriesWithItems,
    });
  } catch (error) {
    console.error('Get menu error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
