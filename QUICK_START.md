# QR Menu Manager - Quick Start Guide

Get your QR Menu Manager up and running in 5 minutes! ⚡

## Prerequisites

- Node.js 18+ installed
- MongoDB (local or Atlas account)
- Stripe test account

## 5-Minute Setup

### 1️⃣ Install Dependencies (2 min)

```bash
npm install
```

### 2️⃣ Configure Environment (1 min)

```bash
# Copy environment template
cp env.example .env.local
```

**Edit `.env.local` with minimum required variables:**

```env
# Database - Use local or MongoDB Atlas
MONGODB_URI=mongodb://localhost:27017/qr-menu-manager

# Auth Secrets - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-key
JWT_SECRET=your-jwt-secret-key

# Stripe - Get from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email - For development, can leave as-is
EMAIL_FROM=noreply@localhost.com

# App URL
APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3️⃣ Seed Database (30 sec)

```bash
npm run seed
```

✅ Creates demo owner account: **owner@test.com** / **password123**  
✅ Creates demo restaurant with QR code  
✅ Adds sample menu items and orders

### 4️⃣ Start Development Server (30 sec)

```bash
npm run dev
```

### 5️⃣ Test It Out! (1 min)

1. **Homepage**: http://localhost:3000
2. **Owner Login**: http://localhost:3000/login
   - Email: `owner@test.com`
   - Password: `password123`
3. **Demo Menu**: http://localhost:3000/menu/demo-restaurant
4. **API Test**: http://localhost:3000/api/auth/me

## 🎉 You're Ready!

Your QR Menu Manager is now running locally. Here's what you can do:

### As Restaurant Owner

1. **Login** at `/login` with demo credentials
2. **Create New Restaurant**
   ```bash
   POST /api/owner/restaurant
   {
     "name": "My Restaurant",
     "slug": "my-restaurant",
     "tableNumber": 20
   }
   ```
3. **Add Categories**
   ```bash
   POST /api/owner/categories
   {
     "restaurantId": "your-restaurant-id",
     "name": "Appetizers"
   }
   ```
4. **Add Menu Items**
   ```bash
   POST /api/owner/menu-items
   {
     "restaurantId": "your-restaurant-id",
     "categoryId": "your-category-id",
     "name": "Caesar Salad",
     "priceCents": 1200
   }
   ```

### As Customer

1. Visit: `http://localhost:3000/menu/demo-restaurant`
2. Browse menu items
3. Add items to cart (via API)
4. Complete checkout with Stripe test card: **4242 4242 4242 4242**

## 🧪 Test with Stripe

Use these test cards:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Auth Required**: 4000 0025 0000 3155

Any future date for expiry, any 3 digits for CVC.

## 📚 Next Steps

1. **Read Documentation**
   - [README.md](./README.md) - Complete guide
   - [API.md](./docs/API.md) - API documentation
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deploy to production

2. **Explore API Endpoints**
   - Import [Postman Collection](./docs/QR-Menu-Manager.postman_collection.json)
   - All endpoints documented with examples

3. **Build Frontend Pages**
   - Owner Dashboard UI
   - Menu Builder with drag-and-drop
   - Customer Menu Page
   - Shopping Cart UI

4. **Run Tests**
   ```bash
   npm test              # Unit tests
   npm run test:e2e      # E2E tests
   ```

5. **Deploy**
   - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Deploy to Vercel in minutes

## 🐛 Troubleshooting

### MongoDB Connection Error

**Problem**: Cannot connect to MongoDB

**Solution**:
```bash
# If using local MongoDB, start it:
mongod --dbpath /path/to/data

# Or use MongoDB Atlas and update MONGODB_URI
```

### Stripe Webhook Error

**Problem**: Orders not created after payment

**Solution**:
- Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret to .env.local
```

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**:
```bash
# Change port
PORT=3001 npm run dev
```

## 💡 Pro Tips

1. **Use Stripe CLI** for local webhook testing
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Watch Logs** to debug issues
   ```bash
   npm run dev
   # Server logs appear in terminal
   ```

3. **MongoDB Compass** to view database
   - Download: https://www.mongodb.com/products/compass
   - Connect with your MONGODB_URI

4. **Hot Reload** works automatically
   - Edit any file and see changes instantly

## 📞 Need Help?

- **Documentation**: Check README.md and API.md
- **Project Summary**: See PROJECT_SUMMARY.md for architecture overview
- **Common Issues**: Review DEPLOYMENT_GUIDE.md troubleshooting section

## 🚀 Ready for Production?

When you're ready to deploy:

1. Get production credentials (Stripe, MongoDB Atlas, SendGrid)
2. Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Deploy to Vercel with one command: `vercel`

---

**Happy Building! 🎉**

Built with ❤️ for modern restaurants
