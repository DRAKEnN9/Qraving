import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../src/models/User';
import Restaurant from '../src/models/Restaurant';
import Category from '../src/models/Category';
import MenuItem from '../src/models/MenuItem';
import Order from '../src/models/Order';
import { hashPassword } from '../src/lib/auth';
import { generateQRCode } from '../src/lib/qrcode';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-menu-manager';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    console.log('✓ Existing data cleared');

    // Create sample owner
    console.log('Creating sample owner...');
    const passwordHash = await hashPassword('password123');
    const owner = await User.create({
      name: 'Demo Owner',
      email: 'owner@test.com',
      passwordHash,
      role: 'owner',
    });
    console.log('✓ Owner created:', owner.email);

    // Create sample restaurant
    console.log('Creating sample restaurant...');
    const restaurant = await Restaurant.create({
      ownerId: owner._id,
      name: 'Demo Restaurant',
      address: '123 Main Street, New York, NY 10001',
      tableNumber: 15,
      slug: 'demo-restaurant',
      logoUrl: 'https://via.placeholder.com/200x200?text=Demo+Restaurant',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        enableNotifications: true,
      },
    });

    // Generate QR code
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const menuUrl = `${appUrl}/menu/${restaurant.slug}`;
    const qrCodeDataUrl = await generateQRCode(menuUrl);
    restaurant.qrCodeUrl = qrCodeDataUrl;
    await restaurant.save();
    console.log('✓ Restaurant created:', restaurant.name);
    console.log('  QR Code URL:', menuUrl);

    // Create categories
    console.log('Creating categories...');
    const appetizersCategory = await Category.create({
      restaurantId: restaurant._id,
      name: 'Appetizers',
      order: 0,
    });

    const mainsCategory = await Category.create({
      restaurantId: restaurant._id,
      name: 'Main Courses',
      order: 1,
    });

    const dessertsCategory = await Category.create({
      restaurantId: restaurant._id,
      name: 'Desserts',
      order: 2,
    });

    const drinksCategory = await Category.create({
      restaurantId: restaurant._id,
      name: 'Beverages',
      order: 3,
    });
    console.log('✓ Categories created');

    // Create menu items
    console.log('Creating menu items...');

    // Appetizers
    await MenuItem.create([
      {
        restaurantId: restaurant._id,
        categoryId: appetizersCategory._id,
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        priceCents: 1200,
        images: ['https://via.placeholder.com/400x300?text=Caesar+Salad'],
        orderable: true,
        soldOut: false,
        modifiers: [
          { name: 'Add Grilled Chicken', priceDelta: 500 },
          { name: 'Add Shrimp', priceDelta: 700 },
        ],
        order: 0,
      },
      {
        restaurantId: restaurant._id,
        categoryId: appetizersCategory._id,
        name: 'Mozzarella Sticks',
        description: 'Crispy fried mozzarella served with marinara sauce',
        priceCents: 950,
        images: ['https://via.placeholder.com/400x300?text=Mozzarella+Sticks'],
        orderable: true,
        soldOut: false,
        modifiers: [],
        order: 1,
      },
    ]);

    // Main Courses
    await MenuItem.create([
      {
        restaurantId: restaurant._id,
        categoryId: mainsCategory._id,
        name: 'Classic Cheeseburger',
        description: 'Angus beef patty with cheddar cheese, lettuce, tomato, and special sauce',
        priceCents: 1800,
        images: ['https://via.placeholder.com/400x300?text=Cheeseburger'],
        orderable: true,
        soldOut: false,
        modifiers: [
          { name: 'Add Bacon', priceDelta: 300 },
          { name: 'Make it Double', priceDelta: 500 },
          { name: 'Gluten-Free Bun', priceDelta: 200 },
        ],
        order: 0,
      },
      {
        restaurantId: restaurant._id,
        categoryId: mainsCategory._id,
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with lemon butter sauce and seasonal vegetables',
        priceCents: 2500,
        images: ['https://via.placeholder.com/400x300?text=Grilled+Salmon'],
        orderable: true,
        soldOut: false,
        modifiers: [],
        order: 1,
      },
      {
        restaurantId: restaurant._id,
        categoryId: mainsCategory._id,
        name: 'Vegetarian Pizza',
        description: '12-inch pizza with fresh vegetables and mozzarella',
        priceCents: 1600,
        images: ['https://via.placeholder.com/400x300?text=Pizza'],
        orderable: true,
        soldOut: false,
        modifiers: [
          { name: 'Add Extra Cheese', priceDelta: 200 },
          { name: 'Make it Spicy', priceDelta: 0 },
        ],
        order: 2,
      },
    ]);

    // Desserts
    await MenuItem.create([
      {
        restaurantId: restaurant._id,
        categoryId: dessertsCategory._id,
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        priceCents: 900,
        images: ['https://via.placeholder.com/400x300?text=Lava+Cake'],
        orderable: true,
        soldOut: false,
        modifiers: [],
        order: 0,
      },
      {
        restaurantId: restaurant._id,
        categoryId: dessertsCategory._id,
        name: 'New York Cheesecake',
        description: 'Classic cheesecake with graham cracker crust',
        priceCents: 850,
        images: ['https://via.placeholder.com/400x300?text=Cheesecake'],
        orderable: true,
        soldOut: false,
        modifiers: [
          { name: 'Add Strawberry Topping', priceDelta: 200 },
          { name: 'Add Chocolate Sauce', priceDelta: 150 },
        ],
        order: 1,
      },
    ]);

    // Beverages
    await MenuItem.create([
      {
        restaurantId: restaurant._id,
        categoryId: drinksCategory._id,
        name: 'Fresh Lemonade',
        description: 'Homemade lemonade with fresh lemons',
        priceCents: 400,
        images: [],
        orderable: true,
        soldOut: false,
        modifiers: [],
        order: 0,
      },
      {
        restaurantId: restaurant._id,
        categoryId: drinksCategory._id,
        name: 'Craft Beer',
        description: 'Selection of local craft beers',
        priceCents: 700,
        images: [],
        orderable: true,
        soldOut: false,
        modifiers: [],
        order: 1,
      },
      {
        restaurantId: restaurant._id,
        categoryId: drinksCategory._id,
        name: 'Soft Drinks',
        description: 'Coca-Cola, Sprite, or Fanta',
        priceCents: 300,
        images: [],
        orderable: true,
        soldOut: false,
        modifiers: [],
        order: 2,
      },
    ]);
    console.log('✓ Menu items created');

    // Create sample orders
    console.log('Creating sample orders...');
    const sampleOrders = [
      {
        restaurantId: restaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Classic Cheeseburger',
            priceCents: 1800,
            quantity: 2,
            modifiers: ['Add Bacon'],
          },
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Soft Drinks',
            priceCents: 300,
            quantity: 2,
            modifiers: [],
          },
        ],
        totalCents: 4200,
        currency: 'USD',
        customerName: 'John Doe',
        tableNumber: 5,
        customerEmail: 'john@example.com',
        paymentStatus: 'succeeded',
        status: 'preparing',
      },
      {
        restaurantId: restaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Grilled Salmon',
            priceCents: 2500,
            quantity: 1,
            modifiers: [],
          },
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Caesar Salad',
            priceCents: 1200,
            quantity: 1,
            modifiers: [],
          },
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Fresh Lemonade',
            priceCents: 400,
            quantity: 1,
            modifiers: [],
          },
        ],
        totalCents: 4100,
        currency: 'USD',
        customerName: 'Jane Smith',
        tableNumber: 8,
        customerEmail: 'jane@example.com',
        paymentStatus: 'succeeded',
        status: 'ready',
      },
    ];

    await Order.create(sampleOrders);
    console.log('✓ Sample orders created');

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('==============================================');
    console.log('Demo Credentials:');
    console.log('Email: owner@test.com');
    console.log('Password: password123');
    console.log('==============================================');
    console.log(`Customer Menu URL: ${menuUrl}`);
    console.log('==============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
