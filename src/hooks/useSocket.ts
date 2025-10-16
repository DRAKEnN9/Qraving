import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        path: '/socket.io',
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on unmount to maintain connection across pages
    };
  }, []);

  const joinRestaurant = (restaurantId: string) => {
    if (socket) {
      socket.emit('join-restaurant', restaurantId);
    }
  };

  const leaveRestaurant = (restaurantId: string) => {
    if (socket) {
      socket.emit('leave-restaurant', restaurantId);
    }
  };

  const joinOrder = (orderId: string) => {
    if (socket) {
      socket.emit('join-order', orderId);
    }
  };

  const leaveOrder = (orderId: string) => {
    if (socket) {
      socket.emit('leave-order', orderId);
    }
  };

  const onNewOrder = (callback: (order: any) => void) => {
    if (socket) {
      socket.on('new-order', callback);
      return () => {
        socket?.off('new-order', callback);
      };
    }
  };

  const onOrderStatusUpdate = (callback: (data: { orderId: string; status: string }) => void) => {
    if (socket) {
      socket.on('order-status-update', callback);
      return () => {
        socket?.off('order-status-update', callback);
      };
    }
  };

  const onOrderUpdate = (callback: (order: any) => void) => {
    if (socket) {
      socket.on('order-update', callback);
      return () => {
        socket?.off('order-update', callback);
      };
    }
  };

  return {
    isConnected,
    joinRestaurant,
    leaveRestaurant,
    joinOrder,
    leaveOrder,
    onNewOrder,
    onOrderStatusUpdate,
    onOrderUpdate,
  };
}
