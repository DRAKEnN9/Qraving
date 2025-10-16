# QR Menu Manager - Production-Ready Micro-SaaS

A full-stack SaaS application that enables restaurants to create digital menus accessible via QR codes, manage orders in real-time, and accept payments through Stripe.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [Seed Data](#seed-data)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Acceptance Criteria](#acceptance-criteria)

## ✨ Features

### Owner Features
- 🔐 **Authentication**: Email/password signup and login (Google OAuth ready)
- 🏪 **Restaurant Setup**: Create restaurant profile with name, address, logo, and table count
- 📱 **QR Code Generation**: Unique, stable QR code per restaurant for customer menu access
- 🎨 **Drag-and-Drop Menu Builder**: Full CRUD operations for menu items with categories
  - Add/edit items with name, description, price, photos, modifiers
  - Toggle orderable/sold-out status
  - Reorder categories and items
- 📦 **Order Management Dashboard**: View incoming orders with real-time updates
  - Filter by status (Received → Preparing → Ready → Completed)
  - Update order status with automatic email notifications
- 📊 **Analytics**: View total orders, revenue, popular items (Pro tier: peak times, table turnover)
- 💳 **Stripe Integration**: Subscription billing ($9/mo Basic, $19/mo Pro)
- 📧 **Email Notifications**: Automatic order confirmations and status updates

### Customer Features
- 📱 **Mobile-First Menu**: Scan QR code to access responsive digital menu
- 🛒 **Shopping Cart**: Add items, select quantity, choose modifiers, add special requests
- 💳 **Stripe Checkout**: Secure payment processing (hosted Stripe Checkout page)
- ✉️ **Order Confirmation**: Email confirmation with order details
- 🔄 **Real-Time Updates**: Order status updates via Socket.io (if page remains open)
- 🚫 **No Account Required**: Customers order without creating accounts

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **@dnd-kit** - Drag-and-drop functionality
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Recharts** - Analytics charts

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB + Mongoose** - Database and ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Integrations
- **Stripe** - Payment processing and subscriptions
- **Cloudinary** - Image uploads and storage
- **SendGrid/Nodemailer** - Email delivery
- **QRCode** - QR code generation

### Testing & Quality
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** (local or MongoDB Atlas)
- **Stripe Account** (test mode keys)
- **Cloudinary Account** (optional, for image uploads)
- **SendGrid Account** or Gmail App Password (for emails)

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd QRMenuManager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
```

Edit `.env.local` with your actual credentials (see [Environment Variables](#environment-variables)).

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/qr-menu-manager
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-menu-manager

# NextAuth / JWT
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_BASIC_PRICE_ID=price_basic_plan_id
STRIPE_PRO_PRICE_ID=price_pro_plan_id

# Email (Choose one)
# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# OR Gmail
# GMAIL_USER=your-email@gmail.com
# GMAIL_APP_PASSWORD=your-gmail-app-password

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application
APP_URL=http://localhost:3000
NODE_ENV=development
```

### Getting API Keys

#### Stripe
1. Sign up at [stripe.com](https://stripe.com)
2. Get test API keys from Dashboard → Developers → API keys
3. Set up webhook endpoint for `/api/webhooks/stripe`
4. Create products and get price IDs for Basic ($9/mo) and Pro ($19/mo) plans

#### MongoDB Atlas (Recommended)
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster and get connection string
3. Replace `<password>` in connection string

#### SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify sender email address
3. Create API key with Mail Send permissions

#### Cloudinary (Optional)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Lint & Format

```bash
npm run lint
npm run format
```

## 🗄 Database Setup

The application uses MongoDB with Mongoose ODM. Models will be automatically created on first connection.

### Local MongoDB

```bash
# Install MongoDB locally
# https://docs.mongodb.com/manual/installation/

# Start MongoDB
mongod --dbpath /path/to/data
```

### MongoDB Atlas (Cloud)

1. Create free cluster at MongoDB Atlas
2. Add database user
3. Whitelist IP address (0.0.0.0/0 for development)
4. Get connection string and add to `.env.local`

## 🌱 Seed Data

Generate sample data for testing:

```bash
npm run seed
```

This creates:
- Sample owner account (email: owner@test.com, password: password123)
- Demo restaurant with slug `demo-restaurant`
- Categories and menu items
- Sample orders

### Access Demo

- **Owner Dashboard**: Login with `owner@test.com` / `password123`
- **Customer Menu**: Visit [http://localhost:3000/menu/demo-restaurant](http://localhost:3000/menu/demo-restaurant)
- **QR Code**: Generated automatically, accessible in restaurant settings

## 📚 API Documentation

See [API.md](./docs/API.md) for complete endpoint documentation or import the Postman collection:

```bash
# Postman collection
./docs/QR-Menu-Manager.postman_collection.json
```

### Key Endpoints

#### Authentication
- `POST /api/auth/signup` - Create new owner account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user

#### Owner - Restaurant
- `GET /api/owner/restaurant` - List owner's restaurants
- `POST /api/owner/restaurant` - Create restaurant
- `PATCH /api/owner/restaurant/:id` - Update restaurant
- `DELETE /api/owner/restaurant/:id` - Delete restaurant

#### Owner - Menu
- `GET /api/owner/categories` - Get categories
- `POST /api/owner/categories` - Create category
- `GET /api/owner/menu-items` - Get menu items
- `POST /api/owner/menu-items` - Create menu item
- `PATCH /api/owner/menu-items/:id` - Update item

#### Owner - Orders
- `GET /api/owner/orders` - List orders with filters
- `PATCH /api/owner/orders/:id/status` - Update order status
- `GET /api/owner/analytics` - Get analytics data

#### Public - Customer
- `GET /api/restaurant/:slug/menu` - Get public menu
- `POST /api/restaurant/:slug/checkout` - Create Stripe checkout

#### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm test -- --coverage
```

## 🚀 Deployment

### Vercel (Recommended for Frontend)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables**
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add all variables from `.env.local`
- Set `APP_URL` to your Vercel URL

4. **Configure Stripe Webhook**
- Add webhook endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
- Events to listen: `checkout.session.completed`, `payment_intent.succeeded`

### Docker (Development)

```bash
# Build image
docker build -t qr-menu-manager .

# Run container
docker run -p 3000:3000 --env-file .env.local qr-menu-manager
```

### Docker Compose

```bash
docker-compose up
```

## 📁 Project Structure

```
QRMenuManager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── owner/        # Owner-protected endpoints
│   │   │   ├── restaurant/   # Public customer endpoints
│   │   │   └── webhooks/     # Stripe webhooks
│   │   ├── (auth)/           # Auth pages (login, signup)
│   │   ├── (customer)/       # Customer-facing pages
│   │   ├── (dashboard)/      # Owner dashboard pages
│   │   └── layout.tsx        # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   └── customer/         # Customer-facing components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   │   ├── mongodb.ts        # Database connection
│   │   ├── stripe.ts         # Stripe utilities
│   │   ├── auth.ts           # Auth utilities
│   │   ├── email.ts          # Email templates and sender
│   │   ├── qrcode.ts         # QR code generation
│   │   ├── socket.ts         # Socket.io setup
│   │   ├── cloudinary.ts     # Image upload
│   │   └── validation.ts     # Zod schemas
│   └── models/                # Mongoose models
│       ├── User.ts
│       ├── Restaurant.ts
│       ├── Category.ts
│       ├── MenuItem.ts
│       ├── Order.ts
│       ├── Subscription.ts
│       └── WebhookLog.ts
├── scripts/
│   └── seed.ts               # Database seeding script
├── docs/
│   ├── API.md                # API documentation
│   └── *.postman_collection.json
├── tests/
│   ├── unit/                 # Unit tests
│   └── e2e/                  # E2E tests
├── public/                    # Static assets
├── .env.example              # Example environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## ✅ Acceptance Criteria

### MVP Checklist

- [x] Owner can signup and create account
- [x] Owner can create restaurant with unique slug
- [x] QR code automatically generated for restaurant
- [x] Owner can create categories and menu items (drag-and-drop)
- [x] Menu items support images, modifiers, orderable/sold-out toggles
- [x] Customer can access menu via QR code/slug without login
- [x] Customer can add items to cart with modifiers
- [x] Customer can checkout using Stripe Checkout
- [x] Order created only after successful payment
- [x] Owner sees orders in dashboard with real-time updates (Socket.io)
- [x] Owner can update order status (Received → Preparing → Ready → Completed)
- [x] Customer receives confirmation email on payment
- [x] Customer receives status update emails
- [x] Stripe webhooks verified with signature check
- [x] Webhook events logged in database
- [x] Analytics dashboard shows orders, revenue, top items (last 30 days)
- [x] Email notifications sent via SendGrid/Nodemailer
- [x] Environment variables documented
- [x] Seed script creates sample data
- [ ] Unit tests for critical functions
- [ ] E2E test for complete order flow
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker setup for development

### Test Script

1. **Owner Workflow**
   - Sign up → Create restaurant → Generate QR code ✓
   - Create categories → Add menu items with images ✓
   - Edit item: change price, toggle sold-out ✓
   - View orders dashboard ✓

2. **Customer Workflow**
   - Scan QR code → View menu ✓
   - Add items to cart → Proceed to checkout ✓
   - Complete Stripe payment ✓
   - Receive confirmation email ✓

3. **Real-Time**
   - Order appears in owner dashboard within 5 seconds ✓
   - Owner updates status → Customer receives email ✓

4. **Security & Quality**
   - Webhook signature verification ✓
   - Input validation and sanitization ✓
   - Protected API routes require authentication ✓

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Email: support@qrmenumanager.com

## 🔮 Roadmap

### Future Enhancements (Post-MVP)
- [ ] Google OAuth integration
- [ ] Multi-language menu support
- [ ] Table management and reservations
- [ ] Receipt generation (PDF)
- [ ] Multi-menu per time slot (breakfast/lunch/dinner)
- [ ] Kitchen display system (KDS)
- [ ] Customer order history
- [ ] Loyalty program
- [ ] Advanced analytics with charts
- [ ] SMS notifications
- [ ] Multi-restaurant support for chains

---

**Built with ❤️ for modern restaurants**
