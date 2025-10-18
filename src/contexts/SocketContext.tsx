'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRestaurant: (restaurantId: string) => void;
  leaveRestaurant: (restaurantId: string) => void;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinRestaurant: () => {},
  leaveRestaurant: () => {},
  joinOrder: () => {},
  leaveOrder: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || 'https://your-render-service.onrender.com'
      : 'http://localhost:3000';
    
    const socketInstance = io(socketUrl, {
      // MUST match server.js path exactly (no trailing slash)
      path: '/socket.io',
      // Prefer websockets to avoid xhr polling issues behind proxies
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRestaurant = (restaurantId: string) => {
    if (socket && isConnected) {
      socket.emit('join-restaurant', restaurantId);
      console.log('Joining restaurant room:', restaurantId);
    }
  };

  const leaveRestaurant = (restaurantId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-restaurant', restaurantId);
      console.log('Leaving restaurant room:', restaurantId);
    }
  };

  const joinOrder = (orderId: string) => {
    if (socket && isConnected) {
      socket.emit('join-order', orderId);
      console.log('Joining order room:', orderId);
    }
  };

  const leaveOrder = (orderId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-order', orderId);
      console.log('Leaving order room:', orderId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRestaurant, leaveRestaurant, joinOrder, leaveOrder }}>
      {children}
    </SocketContext.Provider>
  );
}
