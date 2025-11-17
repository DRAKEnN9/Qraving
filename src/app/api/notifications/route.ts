import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkApiSubscriptionAccess } from '@/lib/apiSubscriptionGuard';
import { checkSubscriptionAccess } from '@/lib/subscription.server';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Generate notifications based on user's subscription status and other events
    const notifications = [];
    
    try {
      const subscriptionAccess = await checkSubscriptionAccess(user);
      
      // Subscription-related notifications
      if (subscriptionAccess.status === 'trialing' && subscriptionAccess.trialEndsAt) {
        const trialEndDate = new Date(subscriptionAccess.trialEndsAt);
        const daysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 7 && daysLeft > 0) {
          notifications.push({
            id: 'trial-ending',
            type: 'subscription',
            title: `Trial Ending ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} Days`}`,
            message: `Your 14-day free trial ends ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}. Subscribe now to continue using all features.`,
            createdAt: new Date(),
            read: false,
            actionUrl: '/dashboard/billing',
            actionText: 'View Subscription Plans',
            priority: daysLeft <= 3 ? 'high' : 'medium'
          });
        }
      }

      // Show scheduled-cancellation notice whenever a cancellation at period end is set
      if (subscriptionAccess.cancelAtPeriodEnd && subscriptionAccess.currentPeriodEnd) {
        const periodEndDate = new Date(subscriptionAccess.currentPeriodEnd);
        const daysLeft = Math.ceil((periodEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          notifications.push({
            id: 'subscription-ending',
            type: 'warning',
            title: `Subscription Ending ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} Days`}`,
            message: `Your subscription will end ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}. Reactivate now to continue service.`,
            createdAt: new Date(),
            read: false,
            actionUrl: '/dashboard/billing',
            actionText: 'Reactivate Subscription',
            priority: 'high'
          });
        }
      }

      // Upcoming billing cycle reminder for active subscriptions
      if (subscriptionAccess.status === 'active' && subscriptionAccess.currentPeriodEnd) {
        const renewDate = new Date(subscriptionAccess.currentPeriodEnd);
        const daysLeft = Math.ceil((renewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7 && daysLeft >= 0) {
          notifications.push({
            id: 'upcoming-billing',
            type: daysLeft <= 3 ? 'warning' : 'info',
            title: daysLeft === 0 ? 'Billing Today' : `Upcoming Billing ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} Days`}`,
            message:
              daysLeft === 0
                ? 'Your subscription renews today. Please ensure sufficient funds are available to avoid payment failure.'
                : `Your subscription will renew ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}. Ensure sufficient funds are available before the due date to avoid payment failure.`,
            createdAt: new Date(),
            read: false,
            actionUrl: '/dashboard/billing',
            actionText: 'View Billing',
            priority: daysLeft <= 3 ? 'high' : 'medium'
          });
        }
      }

      // Immediate cancellation (no access retained)
      if (subscriptionAccess.status === 'cancelled' && !subscriptionAccess.cancelAtPeriodEnd) {
        notifications.push({
          id: 'subscription-cancelled',
          type: 'error',
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled. You no longer have access to premium features.',
          createdAt: new Date(),
          read: false,
          actionUrl: '/dashboard/billing',
          actionText: 'View Plans',
          priority: 'high'
        });
      }

      if (subscriptionAccess.status === 'past_due') {
        notifications.push({
          id: 'payment-failed',
          type: 'error',
          title: 'Payment Failed',
          message: 'Your subscription payment failed. Please update your payment method to continue service.',
          createdAt: new Date(),
          read: false,
          actionUrl: '/dashboard/billing',
          actionText: 'Update Payment Method',
          priority: 'high'
        });
      }

      // Add general notifications (in a real app, these would come from a database)
      notifications.push(
        {
          id: 'welcome',
          type: 'info',
          title: 'Welcome to QR Menu Manager!',
          message: 'Start by creating your first restaurant and menu to begin accepting orders.',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          read: false,
          actionUrl: '/dashboard',
          actionText: 'Get Started',
          priority: 'medium'
        }
      );

      // Sort by priority and creation date
      const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
      notifications.sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    } catch (error) {
      console.error('Error generating subscription notifications:', error);
      // Continue without subscription notifications if there's an error
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, action } = await request.json();

    // In a real implementation, you would update the notification status in the database
    // For now, just return success
    if (action === 'mark_read' && notificationId) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
