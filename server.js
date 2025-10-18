const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const origins = process.env.NODE_ENV === 'production'
    ? [process.env.APP_URL, process.env.RENDER_EXTERNAL_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000', `http://${hostname}:${port}`];
  const io = new Server(server, {
    cors: {
      origin: origins.filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Normalize to no trailing slash (must match client exactly)
    path: '/socket.io',
  });

  // Store restaurant rooms (restaurantId -> Set of socket IDs)
  const restaurantRooms = new Map();
  // Store order rooms (orderId -> Set of socket IDs) 
  const orderRooms = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join restaurant room
    socket.on('join-restaurant', (restaurantId) => {
      console.log(`Socket ${socket.id} joining restaurant ${restaurantId}`);
      socket.join(`restaurant:${restaurantId}`);
      
      if (!restaurantRooms.has(restaurantId)) {
        restaurantRooms.set(restaurantId, new Set());
      }
      restaurantRooms.get(restaurantId).add(socket.id);
      
      socket.emit('joined-restaurant', { restaurantId });
    });

    // Join order room (for customers waiting for their order)
    socket.on('join-order', (orderId) => {
      if (!orderId) return;
      console.log(`Socket ${socket.id} joining order ${orderId}`);
      socket.join(`order:${orderId}`);
      
      if (!orderRooms.has(orderId)) {
        orderRooms.set(orderId, new Set());
      }
      orderRooms.get(orderId).add(socket.id);
      
      socket.emit('joined-order', { orderId });
    });

    // Leave order room
    socket.on('leave-order', (orderId) => {
      if (!orderId) return;
      console.log(`Socket ${socket.id} leaving order ${orderId}`);
      socket.leave(`order:${orderId}`);
      
      if (orderRooms.has(orderId)) {
        orderRooms.get(orderId).delete(socket.id);
        if (orderRooms.get(orderId).size === 0) {
          orderRooms.delete(orderId);
        }
      }
    });

    // Join user room (for direct user notifications like membership removal)
    socket.on('join-user', (userId) => {
      if (!userId) return;
      console.log(`Socket ${socket.id} joining user:${userId}`);
      socket.join(`user:${userId}`);
    });

    // Leave user room
    socket.on('leave-user', (userId) => {
      if (!userId) return;
      console.log(`Socket ${socket.id} leaving user:${userId}`);
      socket.leave(`user:${userId}`);
    });

    // Leave restaurant room
    socket.on('leave-restaurant', (restaurantId) => {
      console.log(`Socket ${socket.id} leaving restaurant ${restaurantId}`);
      socket.leave(`restaurant:${restaurantId}`);
      
      if (restaurantRooms.has(restaurantId)) {
        restaurantRooms.get(restaurantId).delete(socket.id);
        if (restaurantRooms.get(restaurantId).size === 0) {
          restaurantRooms.delete(restaurantId);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up restaurant rooms
      restaurantRooms.forEach((sockets, restaurantId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            restaurantRooms.delete(restaurantId);
          }
        }
      });

      // Clean up order rooms
      orderRooms.forEach((sockets, orderId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            orderRooms.delete(orderId);
          }
        }
      });
    });
  });

  // Make io accessible globally for API routes
  global.io = io;

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server initialized`);
  });
});
