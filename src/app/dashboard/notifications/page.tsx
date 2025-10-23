'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Bell, BellOff, CheckCircle, AlertCircle, Info, CreditCard, Calendar, Clock, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'subscription' | 'order';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'subscription' | 'order'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications.map((notif: any) => ({
          ...notif,
          createdAt: new Date(notif.createdAt)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to empty notifications on error
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId: id, action: 'mark_read' })
      });

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      case 'subscription': return CreditCard;
      case 'order': return Bell;
      default: return Info;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    const baseColors = {
      success: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
      subscription: 'text-purple-600 bg-purple-100',
      order: 'text-blue-600 bg-blue-100',
      info: 'text-gray-600 bg-gray-100'
    };

    if (priority === 'high') {
      return 'text-red-600 bg-red-100 ring-2 ring-red-200';
    }

    return baseColors[type];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Bell className="mx-auto h-12 w-12 animate-pulse text-emerald-600" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="mt-2 text-gray-600 dark:text-slate-400">
                Stay updated with important information about your restaurants
              </p>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Mark all as read
                </button>
              )}
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {unreadCount} unread
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-2">
            {(['all', 'unread', 'subscription', 'order'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
              <p className="mt-2 text-gray-500 dark:text-slate-400">
                {filter === 'all' 
                  ? "You're all caught up!" 
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type, notification.priority);
              
              return (
                <div
                  key={notification.id}
                  className={`rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:border-slate-700 ${
                    !notification.read ? 'border-l-4 border-l-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-2 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {notification.priority === 'high' && (
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                              High Priority
                            </span>
                          )}
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          )}
                        </div>
                        <p className="mt-1 text-gray-600 dark:text-slate-300">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </div>
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              {notification.actionText || 'View Details'}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="rounded-lg p-1 text-gray-400 hover:text-emerald-600"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="rounded-lg p-1 text-gray-400 hover:text-red-600"
                        title="Delete notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
