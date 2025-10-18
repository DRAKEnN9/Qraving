import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId, resolveAccountRole } from '@/lib/ownership';
import { updateRestaurantSchema } from '@/lib/validation';

// GET single restaurant
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

    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const restaurant = await Restaurant.findOne({ _id: id, ownerId });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update restaurant
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

    const body = await request.json();
    console.log('===== UPDATE RESTAURANT DEBUG =====');
    console.log('Restaurant ID:', id);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const validatedData = updateRestaurantSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // If not account-level owner, block currency updates
    const account = await resolveAccountRole(user);
    if (!account || account.role !== 'owner') {
      if (validatedData.settings && (validatedData.settings as any).currency !== undefined) {
        delete (validatedData.settings as any).currency;
      }
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: validatedData },
      { new: true, runValidators: true }
    );
    
    console.log('Updated restaurant:', restaurant?.name);
    console.log('===== END DEBUG =====');

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Restaurant updated successfully',
      restaurant,
    });
  } catch (error: any) {
    console.error('Update restaurant error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE restaurant
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

    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const restaurant = await Restaurant.findOneAndDelete({ _id: id, ownerId });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
