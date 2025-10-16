# 🔍 Payment Error Troubleshooting Guide

## Current Error: "Razorpay API error: {}"

This empty error means the API is failing. Let's debug step by step.

---

## Step 1: Check Server Logs

**Open your terminal where the dev server is running**. You should see detailed logs like:

```
=== Razorpay Checkout API Called ===
Checking Razorpay configuration...
```

### Possible Log Messages:

#### ❌ "Razorpay not initialized"
**Problem**: Razorpay credentials not configured

**Solution**: 
1. Create `.env.local` in project root
2. Add:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```
3. **Restart server** (Ctrl+C, then `npm run dev`)

---

#### ❌ "Failed to initialize Razorpay"
**Problem**: Invalid credentials or Razorpay package not installed

**Solution**:
```bash
# Install razorpay
npm install razorpay

# Restart server
npm run dev
```

---

#### ❌ "Validation error"
**Problem**: Missing required fields

**Check**:
- Customer name filled?
- Email filled?
- Table number filled?
- Items in cart?

---

#### ❌ "Restaurant not found"
**Problem**: Restaurant doesn't exist in database

**Solution**:
1. Go to dashboard
2. Create a restaurant
3. Get the correct slug
4. Use that slug in URL

---

## Step 2: Check Browser Console

Press **F12** → **Console** tab

### Look for:

```javascript
Request data: {
  restaurantId: "...",
  itemCount: 2,
  customerName: "Test User",
  tableNumber: 5
}
```

If you see this, data is being sent correctly ✅

---

## Step 3: Check .env.local File

**File location**: `f:\QRMenuManager\.env.local`

**Should contain** (minimum):

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/qr-menu-manager

# Razorpay - REQUIRED!
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# App
APP_URL=http://localhost:3000
```

### Common Mistakes:

❌ **File named wrong**:
- Should be `.env.local` NOT `.env` or `env.local`

❌ **Wrong location**:
- Must be in project root: `f:\QRMenuManager\.env.local`
- NOT in `src/` folder

❌ **Extra spaces**:
```bash
# Wrong:
RAZORPAY_KEY_ID = rzp_test_xxx  # spaces around =

# Correct:
RAZORPAY_KEY_ID=rzp_test_xxx
```

❌ **Truncated keys**:
```bash
# Wrong (incomplete):
RAZORPAY_KEY_ID=rzp_test_1a2b3c4d5e6f...

# Correct (full key):
RAZORPAY_KEY_ID=rzp_test_1a2b3c4d5e6f7g8h9i0j
```

---

## Step 4: Get Razorpay Keys

### If you don't have keys yet:

1. **Sign up**: https://dashboard.razorpay.com/signup
2. **Dashboard** → **Settings** → **API Keys**
3. **Generate Test Key**
4. **Copy both**:
   - Key ID (starts with `rzp_test_`)
   - Key Secret (click eye icon to reveal)

### Test Keys Look Like:

```bash
RAZORPAY_KEY_ID=rzp_test_1a2b3c4d5e6f7g8h
RAZORPAY_KEY_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz123456
```

---

## Step 5: Verify Installation

```bash
# Check if razorpay is installed
npm list razorpay

# Should show:
# razorpay@2.9.6 or similar

# If not installed:
npm install razorpay
```

---

## Step 6: Restart Server (CRITICAL!)

**You MUST restart after ANY change to .env.local**

```bash
# Stop server
Ctrl+C

# Start again
npm run dev

# Wait for:
# ✓ Ready in X ms
# ○ Local: http://localhost:3000
```

---

## Step 7: Test Again

1. Go to menu
2. Add items
3. Checkout
4. Fill all fields
5. Click "Place Order"

### Expected Server Logs:

```
=== Razorpay Checkout API Called ===
Checking Razorpay configuration...
✅ Razorpay initialized
Connecting to database...
✅ Database connected
Parsing request body...
Request data: { ... }
Validating data...
✅ Data validated
Creating Razorpay order...
Amount: 50000 paise (₹500)
✅ Razorpay order created: order_xxxxx
```

### Expected Browser:

- Razorpay modal opens ✅
- Can enter payment details ✅

---

## Common Error Messages & Fixes

### "Payment gateway not configured"
```bash
# Add to .env.local:
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Then restart server!
```

### "Cannot find module 'razorpay'"
```bash
npm install razorpay
npm run dev
```

### "Invalid API Key"
- Check key is complete (no truncation)
- Check no extra spaces
- Try regenerating keys in Razorpay dashboard

### "Bad request error"
- Check all form fields filled
- Check items in cart
- Check table number is a number

### Empty error `{}`
- Check server logs (Step 1)
- Server might not be running
- API route might not exist

---

## Debug Checklist

Run through this checklist:

- [ ] Server is running (`npm run dev`)
- [ ] `.env.local` exists in project root
- [ ] `RAZORPAY_KEY_ID` is set
- [ ] `RAZORPAY_KEY_SECRET` is set
- [ ] Keys are complete (no `...`)
- [ ] No extra spaces in `.env.local`
- [ ] Server restarted after adding keys
- [ ] `razorpay` package installed
- [ ] Can see server logs in terminal
- [ ] Restaurant exists in database
- [ ] Items in cart
- [ ] All checkout fields filled

---

## Still Not Working?

### Enable Full Debug Mode:

1. **Check server terminal** - see all the emoji logs:
   - ✅ = Success
   - ❌ = Error

2. **Check browser console (F12)**:
   - See request data
   - See response data

3. **Share these logs** for help:
   - Server terminal output
   - Browser console errors
   - `.env.local` contents (hide actual key values!)

---

## Quick Test Commands

```bash
# Check if env vars are loaded
node -e "console.log(process.env.RAZORPAY_KEY_ID?.substring(0, 15))"
# Should show: rzp_test_xxxxx

# Check razorpay installed
npm list razorpay

# Restart server cleanly
npm run dev
```

---

## Success Looks Like:

### Server Logs:
```
=== Razorpay Checkout API Called ===
✅ Razorpay initialized
✅ Database connected
✅ Data validated
✅ Razorpay order created: order_xxxxx
```

### Browser:
- Razorpay payment modal opens
- Can select payment method
- Can enter card details

### After Payment:
- Redirects to menu
- Order appears in dashboard
- Email sent
- Notification shows

---

## Summary

**Most common issue**: Missing or incorrect Razorpay credentials

**Quick fix**:
1. Get keys from Razorpay dashboard
2. Add to `.env.local`
3. **Restart server**
4. Try again

**Check server logs** - they'll tell you exactly what's wrong! 🎯
