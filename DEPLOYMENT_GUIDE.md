# QR Menu Manager - Deployment Guide

This guide provides step-by-step instructions for deploying the QR Menu Manager application to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- Git installed
- MongoDB Atlas account (or local MongoDB)
- Stripe account with test/live API keys
- Cloudinary account (optional)
- SendGrid account or Gmail with app password
- Vercel account (for deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-menu-manager
NEXTAUTH_SECRET=your-generated-secret
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_FROM=noreply@yourdomain.com
APP_URL=http://localhost:3000

# Optional
SENDGRID_API_KEY=SG....
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### 3. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

### 4. Run Database Seed

```bash
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Production Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Prepare for Deployment

1. **Update package.json**
   - Ensure all dependencies are listed
   - Test build locally: `npm run build`

2. **Create vercel.json** (already included)

#### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Follow prompts to:
- Link to existing project or create new
- Set project name
- Configure settings

#### Step 3: Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Set for Production, Preview, and Development environments

**Important Production Variables:**
```
MONGODB_URI=<your-atlas-uri>
NEXTAUTH_URL=https://your-domain.vercel.app
APP_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<production-secret>
JWT_SECRET=<production-secret>
STRIPE_SECRET_KEY=sk_live_...  # Use live keys
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Will update after webhook setup
SENDGRID_API_KEY=<your-key>
EMAIL_FROM=noreply@yourdomain.com
```

#### Step 4: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `APP_URL` and `NEXTAUTH_URL` to use custom domain

#### Step 5: Set Up Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
6. Redeploy: `vercel --prod`

#### Step 6: Create Stripe Products

1. Go to Stripe Dashboard → Products
2. Create "Basic Plan" product
   - Name: Basic Plan
   - Price: $9/month (recurring)
   - Copy Price ID
3. Create "Pro Plan" product
   - Name: Pro Plan
   - Price: $19/month (recurring)
   - Copy Price ID
4. Update environment variables:
   - `STRIPE_BASIC_PRICE_ID=price_...`
   - `STRIPE_PRO_PRICE_ID=price_...`

### Option 2: Custom Server (VPS/EC2)

#### Step 1: Set Up Server

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 2: Clone and Configure

```bash
# Clone repository
git clone <your-repo-url>
cd QRMenuManager

# Install dependencies
npm ci --production

# Create .env.local
nano .env.local
# Add all production environment variables
```

#### Step 3: Build Application

```bash
npm run build
```

#### Step 4: Start with PM2

```bash
# Start application
pm2 start npm --name "qr-menu" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

#### Step 5: Set Up Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/qr-menu
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/qr-menu /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

### Option 3: Docker Deployment

```bash
# Build image
docker build -t qr-menu-manager .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name qr-menu \
  qr-menu-manager

# Or use docker-compose
docker-compose up -d
```

## Post-Deployment

### 1. Test the Application

- [ ] Visit homepage
- [ ] Sign up new owner account
- [ ] Create restaurant
- [ ] Add categories and menu items
- [ ] Visit public menu page
- [ ] Test checkout flow (use Stripe test card: 4242 4242 4242 4242)
- [ ] Verify order appears in dashboard
- [ ] Update order status
- [ ] Check email notifications

### 2. Monitor Application

Set up monitoring for:
- Application errors (use Sentry or similar)
- API response times
- Database performance
- Stripe webhooks success rate

### 3. Set Up Backups

#### MongoDB Atlas Backups
- Automatic backups are enabled by default
- Configure backup schedule in Atlas dashboard

#### Code Backups
- Push to Git repository regularly
- Use CI/CD for automated deployments

### 4. Security Checklist

- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] Stripe webhook signatures verified
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] MongoDB connection string secured
- [ ] JWT secrets are strong and unique

## Troubleshooting

### Build Failures

**Problem:** Build fails with module not found

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues

**Problem:** Cannot connect to MongoDB

**Solution:**
1. Check MongoDB URI is correct
2. Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 or specific IPs)
3. Check network connectivity
4. Verify database user has correct permissions

### Stripe Webhook Failures

**Problem:** Orders not created after payment

**Solution:**
1. Check webhook endpoint is correct
2. Verify webhook secret matches
3. Check webhook logs in Stripe Dashboard
4. Ensure `/api/webhooks/stripe` endpoint is accessible
5. Check server logs for errors

### Email Not Sending

**Problem:** Emails not being delivered

**Solution:**
1. Verify SendGrid API key or Gmail credentials
2. Check `EMAIL_FROM` is verified in SendGrid
3. Check spam folder
4. Review application logs for email errors
5. Test email credentials separately

### Real-Time Updates Not Working

**Problem:** Orders don't appear in real-time

**Solution:**
1. Check WebSocket connection in browser console
2. Verify Socket.io is running
3. Check for CORS issues
4. Ensure proper port configuration
5. Clear browser cache and reconnect

### Performance Issues

**Problem:** Slow response times

**Solution:**
1. Enable database indexes (done automatically)
2. Implement caching for public menu pages
3. Optimize images (use Cloudinary transformations)
4. Enable CDN for static assets
5. Monitor database query performance

## Support and Maintenance

### Regular Maintenance Tasks

- **Weekly:** Review error logs and fix issues
- **Monthly:** Update dependencies with security patches
- **Quarterly:** Review and optimize database performance
- **Annually:** Review and update SSL certificates (automatic with Let's Encrypt)

### Getting Help

- GitHub Issues: Report bugs and request features
- Email: support@qrmenumanager.com
- Documentation: Review README.md and API.md

---

**Congratulations!** Your QR Menu Manager is now deployed and ready to use. 🎉
