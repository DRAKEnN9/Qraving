'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface NotificationContextType {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  requestPermission: () => Promise<void>;
  toggleSound: () => void;
  playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationsEnabled: false,
  soundEnabled: true,
  requestPermission: async () => {},
  toggleSound: () => {},
  playNotificationSound: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { socket, isConnected } = useSocket();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Load sound preference from localStorage
    const soundPref = localStorage.getItem('notificationSound');
    if (soundPref !== null) {
      setSoundEnabled(soundPref === 'true');
    }
  }, []);

  // Request browser notification permission
  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser does not support notifications');
      toast.error('Browser does not support notifications');
      return;
    }

    // Notifications require HTTPS in most browsers (except localhost)
    try {
      const { protocol, hostname } = window.location;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      if (protocol !== 'https:' && !isLocal) {
        toast.error('Enable HTTPS to use browser notifications');
        return;
      }
    } catch {}

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success('Browser notifications already enabled');
      return;
    }

    if (Notification.permission === 'denied') {
      // Can't prompt again; guide the user to browser settings
      toast.error('Notifications are blocked. Enable them in your browser site settings.');
      setNotificationsEnabled(false);
      return;
    }

    // permission is 'default' — prompt the user
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotificationsEnabled(enabled);
    if (enabled) {
      toast.success('Notifications enabled');
    } else if (permission === 'denied') {
      toast.error('Notifications denied. You can enable them later in site settings.');
    }
  };

  // Toggle sound on/off
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSound', String(newValue));
  };

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create a simple notification beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in hertz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [soundEnabled]);

  // Show browser notification
  const showBrowserNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if (!notificationsEnabled) return;

      try {
        const notification = new Notification(title, {
          body,
          icon: icon || '/icon.png',
          badge: '/icon.png',
          tag: 'qr-menu-order',
          requireInteraction: false,
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Handle click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    },
    [notificationsEnabled]
  );

  // Listen for new orders via Socket.io
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewOrder = (data: any) => {
      console.log('New order received:', data);

      // Only show notifications if user is a restaurant owner/admin
      if (!user || !user.id) {
        console.log('Ignoring new order notification - no authenticated user');
        return;
      }

      // Only restaurant staff should get new order notifications
      // Customers should not receive these notifications
      const isRestaurantStaff = user.role === 'owner' || user.accountRole === 'owner' || user.accountRole === 'admin';
      if (!isRestaurantStaff) {
        console.log('Ignoring new order notification - user is not restaurant staff');
        return;
      }

      // Play sound
      playNotificationSound();

      // Show browser notification
      showBrowserNotification(
        '🔔 New Order Received!',
        `Order #${data.orderNumber} from ${data.customerName} - ${data.itemCount} items`,
        '/icon.png'
      );

      // Show toast notification
      toast.success(
        <div>
          <p className="font-semibold">New Order!</p>
          <p className="text-sm">
            Order #{data.orderNumber} - {data.customerName}
          </p>
        </div>,
        {
          duration: 5000,
          position: 'top-right',
          icon: '🔔',
        }
      );
    };

    const handleOrderStatusUpdate = (data: any) => {
      console.log('Order status updated:', data);
      
      // Show toast for status updates
      toast(
        <div>
          <p className="font-semibold">Order Updated</p>
          <p className="text-sm">
            Order #{data.orderNumber} - {data.status}
          </p>
        </div>,
        {
          duration: 3000,
          position: 'top-right',
          icon: '📦',
        }
      );
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleOrderStatusUpdate);

    // Join user-specific room when we know the user id
    if (user?.id) {
      socket.emit('join-user', user.id);
    }

    const handleMemberRemoved = (data: any) => {
      // Show actionable toast and then logout + redirect
      const tId = toast(
        <div>
          <p className="font-semibold">Access Removed</p>
          <p className="text-sm">You have been removed by the owner.</p>
          <div className="mt-2">
            <button
              onClick={() => {
                try { logout(); } catch {}
                toast.dismiss(tId);
                router.push('/');
              }}
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Go to Home
            </button>
          </div>
        </div>,
        { duration: 8000, position: 'top-right', icon: '🚫' }
      );
    };

    socket.on('member-removed', handleMemberRemoved);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleOrderStatusUpdate);
      socket.off('member-removed', handleMemberRemoved);
      if (user?.id) {
        socket.emit('leave-user', user.id);
      }
    };
  }, [socket, isConnected, playNotificationSound, showBrowserNotification, user?.id, logout, router]);

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        soundEnabled,
        requestPermission,
        toggleSound,
        playNotificationSound,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
