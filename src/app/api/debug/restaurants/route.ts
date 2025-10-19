import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    await dbConnect();
    const docs = await Restaurant.find({}).sort({ createdAt: -1 }).lean();
    const restaurants = docs.map((r: any) => ({
      _id: String(r._id),
      name: r.name,
      slug: r.slug,
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('Debug restaurants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
