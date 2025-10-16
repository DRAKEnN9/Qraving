import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join restaurant room (for owners)
    socket.on('join-restaurant', (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`Socket ${socket.id} joined restaurant:${restaurantId}`);
    });

    // Join order room (for customers)
    socket.on('join-order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order:${orderId}`);
    });

    // Leave rooms
    socket.on('leave-restaurant', (restaurantId: string) => {
      socket.leave(`restaurant:${restaurantId}`);
    });

    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit new order event to restaurant owners
 */
export function emitNewOrder(restaurantId: string, orderData: any) {
  if (io) {
    io.to(`restaurant:${restaurantId}`).emit('new-order', orderData);
  }
}

/**
 * Emit order status update to customer
 */
export function emitOrderStatusUpdate(orderId: string, status: string) {
  if (io) {
    io.to(`order:${orderId}`).emit('order-status-update', { orderId, status });
  }
}

/**
 * Emit order status update to restaurant owners
 */
export function emitOrderUpdate(restaurantId: string, orderData: any) {
  if (io) {
    io.to(`restaurant:${restaurantId}`).emit('order-update', orderData);
  }
}
