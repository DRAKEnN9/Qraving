import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { resolveEffectiveOwnerId } from '@/lib/ownership';
import { TokenPayload } from '@/lib/auth';

export interface TrialEligibility {
  isEligible: boolean;
  reason: 'eligible' | 'already_used' | 'current_trial' | 'active_subscription' | 'pending';
  message: string;
}

/**
 * Check if user is eligible for a free trial
 */
export async function checkTrialEligibility(user: TokenPayload): Promise<TrialEligibility> {
  try {
    await dbConnect();
    
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) {
      return {
        isEligible: false,
        reason: 'already_used',
        message: 'Unable to determine account ownership'
      };
    }

    // Check for any existing or past subscription
    const existingSubscription = await Subscription.findOne({ ownerId });

    if (!existingSubscription) {
      // No subscription record - eligible for trial
      return {
        isEligible: true,
        reason: 'eligible',
        message: 'Eligible for 14-day free trial'
      };
    }

    // If currently on a trial, reflect that first
    if (existingSubscription.status === 'trialing') {
      return {
        isEligible: false,
        reason: 'current_trial',
        message: 'Currently on free trial'
      };
    }

    // If the subscription is cancelled, do not allow another trial
    if (existingSubscription.status === 'cancelled') {
      return {
        isEligible: false,
        reason: 'already_used',
        message: 'Free trial has already been used. Payment required for subscription.'
      };
    }

    // Pending/incomplete/halted/past_due are not eligible for trial
    if (
      existingSubscription.status === 'pending' ||
      existingSubscription.status === 'incomplete' ||
      existingSubscription.status === 'halted' ||
      existingSubscription.status === 'past_due'
    ) {
      return {
        isEligible: false,
        reason: 'pending',
        message: 'Subscription is pending activation or requires attention. Please complete payment.'
      };
    }

    // Determine if a trial was ever used via either flag or historical trialEndsAt value
    const trialWasUsed = (existingSubscription.hasUsedTrial === true) || Boolean(existingSubscription.trialEndsAt);

    if (trialWasUsed) {
      return {
        isEligible: false,
        reason: 'already_used',
        message: 'Free trial has already been used. Payment required for subscription.'
      };
    }

    if (existingSubscription.status === 'active') {
      return {
        isEligible: false,
        reason: 'active_subscription',
        message: 'Already have an active subscription'
      };
    }

    // If subscription exists but status is cancelled/expired and trial not used, still eligible
    return {
      isEligible: true,
      reason: 'eligible',
      message: 'Eligible for 14-day free trial'
    };

  } catch (error) {
    console.error('Error checking trial eligibility:', error);
    // On error, default to not eligible to prevent abuse
    return {
      isEligible: false,
      reason: 'already_used',
      message: 'Unable to verify trial eligibility. Payment required.'
    };
  }
}

/**
 * Mark that user has used their trial (called when trial starts)
 */
export async function markTrialAsUsed(ownerId: string): Promise<void> {
  try {
    await dbConnect();
    
    const result = await Subscription.updateOne(
      { ownerId },
      { 
        $set: { hasUsedTrial: true } 
      },
      { upsert: false } // Don't create new document, just update existing
    );
    
    console.log('Update result:', result);
    
    console.log(`Trial marked as used for owner: ${ownerId}`);
  } catch (error) {
    console.error('Error marking trial as used:', error);
    // Don't throw - this is a tracking operation
  }
}
