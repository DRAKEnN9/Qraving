import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

export const dynamic = 'force-dynamic';

/**
 * ADMIN ONLY: Fix existing subscriptions to add hasUsedTrial field
 * This is needed because existing subscriptions don't have this field
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Find all subscriptions that don't have hasUsedTrial field or have it as undefined
    const subscriptionsToUpdate = await Subscription.find({
      $or: [
        { hasUsedTrial: { $exists: false } },
        { hasUsedTrial: null },
        { hasUsedTrial: undefined }
      ]
    });

    console.log(`Found ${subscriptionsToUpdate.length} subscriptions to update`);

    let updatedCount = 0;
    
    for (const sub of subscriptionsToUpdate) {
      // If they have ever been trialing or are currently trialing, mark trial as used
      const hasUsedTrial = (
        sub.status === 'trialing' || 
        sub.trialEndsAt || 
        (sub.status === 'cancelled' && sub.trialEndsAt)
      );

      await Subscription.updateOne(
        { _id: sub._id },
        { 
          $set: { hasUsedTrial } 
        }
      );

      updatedCount++;
      console.log(`Updated subscription ${sub._id}: hasUsedTrial = ${hasUsedTrial}`);
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} subscriptions`,
      details: subscriptionsToUpdate.map(sub => ({
        id: sub._id,
        ownerId: sub.ownerId,
        status: sub.status,
        hasTrialEndsAt: !!sub.trialEndsAt,
        hasUsedTrial: (
          sub.status === 'trialing' || 
          sub.trialEndsAt || 
          (sub.status === 'cancelled' && sub.trialEndsAt)
        )
      }))
    });

  } catch (error: any) {
    console.error('Fix trial tracking error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
