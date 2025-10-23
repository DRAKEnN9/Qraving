import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import { resolveEffectiveOwnerId, resolveAccountOwnerPrivilege } from '@/lib/ownership';
import { checkApiSubscriptionAccess } from '@/lib/apiSubscriptionGuard';
import { createRestaurantSchema } from '@/lib/validation';
import { generateSlug } from '@/lib/utils';
// GET owner's restaurants
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check subscription access first
    const subscriptionCheck = await checkApiSubscriptionAccess(request);
    if (subscriptionCheck) return subscriptionCheck;

    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Resolve effective owner (owner => self, admin => mapped owner)
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const restaurants = await Restaurant.find({ ownerId });

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new restaurant
export async function POST(request: NextRequest) {
  try {
    // Check subscription access first
    const subscriptionCheck = await checkApiSubscriptionAccess(request);
    if (subscriptionCheck) return subscriptionCheck;

    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Only account-level owner can create restaurants (global owner or promoted admin)
    const ownerId = await resolveAccountOwnerPrivilege(user);
    if (!ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Enforce single-restaurant limit per account
    const existingCount = await Restaurant.countDocuments({ ownerId });
    if (existingCount >= 1) {
      return NextResponse.json(
        { error: 'Restaurant limit reached. Your plan allows 1 restaurant per account.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Auto-generate slug if not provided
    if (!body.slug && body.name) {
      body.slug = generateSlug(body.name);
    }
    const validatedData = createRestaurantSchema.parse(body);

    // Check if slug already exists
    const existingRestaurant = await Restaurant.findOne({ slug: validatedData.slug });
    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Slug already exists. Please choose a different one.' },
        { status: 400 }
      );
    }

    // Create restaurant under the account owner
    const restaurant = await Restaurant.create({
      ownerId,
      ...validatedData,
    });

    // QR codes are now generated dynamically on the frontend
    // No need to store them in the database

    return NextResponse.json(
      {
        message: 'Restaurant created successfully',
        restaurant,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create restaurant error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
