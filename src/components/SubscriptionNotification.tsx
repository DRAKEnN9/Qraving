'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionNotification() {
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    action?: { text: string; href: string };
  } | null>(null);

  useEffect(() => {
    const subscription = searchParams.get('subscription');
    
    switch (subscription) {
      case 'cancelled':
        setNotification({
          type: 'warning',
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled successfully. You can resubscribe anytime to continue using QR Menu Manager.',
          action: { text: 'Start Free Trial', href: '/billing/subscribe?plan=advance&interval=yearly' }
        });
        break;
      case 'expired':
        setNotification({
          type: 'error',
          title: 'Subscription Expired',
          message: 'Your subscription has expired. Please subscribe again to access your dashboard and continue managing your restaurants.',
          action: { text: 'Renew Subscription', href: '/billing/subscribe?plan=advance&interval=yearly' }
        });
        break;
      case 'error':
        setNotification({
          type: 'error',
          title: 'Subscription Error',
          message: 'There was an error checking your subscription status. Please try again or contact support.',
          action: { text: 'Try Again', href: '/login' }
        });
        break;
    }

    // Auto-hide after 10 seconds
    if (subscription) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!notification) return null;

  const Icon = notification.type === 'success' ? CheckCircle : 
               notification.type === 'warning' ? AlertCircle : XCircle;
  
  const bgColor = notification.type === 'success' ? 'bg-green-50 border-green-200' :
                  notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
  
  const textColor = notification.type === 'success' ? 'text-green-800' :
                    notification.type === 'warning' ? 'text-yellow-800' : 'text-red-800';
  
  const iconColor = notification.type === 'success' ? 'text-green-600' :
                    notification.type === 'warning' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`border ${bgColor} p-4 mx-4 mt-4 rounded-lg shadow-sm`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${iconColor} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor}`}>{notification.title}</h3>
          <p className={`mt-1 text-sm ${textColor.replace('800', '700')}`}>{notification.message}</p>
          {notification.action && (
            <div className="mt-3">
              <Link
                href={notification.action.href}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  notification.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  notification.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                  'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {notification.action.text}
              </Link>
            </div>
          )}
        </div>
        <button
          onClick={() => setNotification(null)}
          className={`ml-3 flex-shrink-0 ${textColor.replace('800', '600')} hover:${textColor.replace('800', '800')}`}
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
