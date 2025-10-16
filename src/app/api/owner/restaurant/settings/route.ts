import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId, resolveAccountRole } from '@/lib/ownership';

// PATCH /api/owner/restaurant/settings - Update restaurant settings
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { restaurantId, settings } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Find restaurant owned by the effective owner (owner or mapped from admin)
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

    // Update fields
    if (settings.name !== undefined) restaurant.name = settings.name;
    if (settings.description !== undefined) restaurant.description = settings.description;
    if (settings.address !== undefined) restaurant.address = settings.address;
    if (settings.phone !== undefined) restaurant.phone = settings.phone;
    if (settings.email !== undefined) restaurant.email = settings.email;
    // Only account-level owners can change currency (global owner or promoted admin)
    const account = await resolveAccountRole(user);
    if (account?.role === 'owner' && settings.currency !== undefined) restaurant.settings.currency = settings.currency;
    if (settings.timezone !== undefined) restaurant.settings.timezone = settings.timezone;
    if (settings.openingHours !== undefined) restaurant.settings.openingHours = settings.openingHours;

    await restaurant.save();

    return NextResponse.json({
      message: 'Settings updated successfully',
      restaurant,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
