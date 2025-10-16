# 🔐 Razorpay Setup Guide

## Error: "Failed to create payment order"

This error means Razorpay credentials are not configured. Follow these steps:

---

## Step 1: Get Razorpay Credentials

### Option A: Test Mode (For Development) ⚡

1. **Sign up for Razorpay**:
   - Go to https://dashboard.razorpay.com/signup
   - Create a free account

2. **Get Test API Keys**:
   - After signup, you'll see the dashboard
   - Click **Settings** (gear icon) → **API Keys**
   - Click **Generate Test Key**
   - You'll see:
     - **Key ID**: Starts with `rzp_test_`
     - **Key Secret**: Click "eye" icon to reveal

3. **Copy both keys** (you'll need them in Step 2)

### Option B: Live Mode (For Production) 🚀

⚠️ **Only use after KYC approval and testing**

1. Complete KYC verification in Razorpay dashboard
2. Get **Live API Keys** from Settings → API Keys
3. Keys will start with `rzp_live_`

---

## Step 2: Configure Environment Variables

1. **Open/Create `.env.local`** in your project root:

```bash
# If file doesn't exist, create it:
# In project root (f:\QRMenuManager), create file: .env.local
```

2. **Add Razorpay credentials**:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=whsec_ZZZZZZZZZZZZZZZ

# Example:
# RAZORPAY_KEY_ID=rzp_test_1a2b3c4d5e6f7g8h
# RAZORPAY_KEY_SECRET=AbCdEfGhIjKlMnOpQrSt
```

3. **Save the file**

---

## Step 3: Restart Your Server

**IMPORTANT**: You MUST restart the development server after adding environment variables!

```bash
# Stop server: Press Ctrl+C

# Start again:
npm run dev
```

---

## Step 4: Test Payment

1. **Go to menu**: http://localhost:3000/menu/your-slug
2. **Add items** to cart
3. **Proceed to checkout**
4. **Fill details** and click "Place Order"
5. **Razorpay modal** should open ✅

### Test Card Details:

Use these test credentials in Razorpay's test mode:

**Credit Card**:
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25 (any future date)
OTP: 123456
```

**UPI**:
```
VPA: success@razorpay
```

**Netbanking**:
- Select any bank
- Click "Success"

---

## Step 5: Setup Webhook (Optional but Recommended)

Webhooks allow Razorpay to notify your app when payments succeed:

1. **In Razorpay Dashboard**:
   - Go to **Settings** → **Webhooks**
   - Click **Create New Webhook**

2. **Configure webhook**:
   ```
   Webhook URL: https://yourdomain.com/api/webhooks/razorpay
   
   For local testing with ngrok:
   Webhook URL: https://abc123.ngrok-free.app/api/webhooks/razorpay
   
   Active Events:
   ☑️ payment.captured
   ☑️ payment.failed
   ```

3. **Get webhook secret**:
   - After creating, copy the **Webhook Secret**
   - Add to `.env.local`:
   ```bash
   RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXX
   ```

4. **Restart server** again

---

## Troubleshooting

### Error: "Payment gateway not configured"

**Solution**: 
- Check `.env.local` exists in project root
- Verify credentials are correct
- **Restart server** (this is critical!)
- Check server logs for "Razorpay credentials not configured"

### Error: "Cannot find module 'razorpay'"

**Solution**:
```bash
npm install razorpay
```

### Razorpay modal doesn't open

**Solution**:
- Check browser console for errors
- Verify Razorpay script is loaded (check page source)
- Clear browser cache
- Try in incognito mode

### Payment succeeds but order not created

**Solution**:
- Check webhook is configured
- Verify webhook secret in `.env.local`
- Check server logs for webhook errors
- Use Razorpay dashboard → Webhooks → Logs to debug

### "Invalid API Key" error

**Solution**:
- Verify you copied the full key (don't truncate)
- Check for extra spaces in `.env.local`
- Make sure using test key for test mode
- Try regenerating API keys

---

## Complete .env.local Example

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/qr-menu-manager

# App
APP_URL=http://localhost:3000
NODE_ENV=development

# Razorpay (REQUIRED for payments)
RAZORPAY_KEY_ID=rzp_test_1a2b3c4d5e6f7g8h
RAZORPAY_KEY_SECRET=AbCdEfGhIjKlMnOpQrSt
RAZORPAY_WEBHOOK_SECRET=whsec_XyZ123456789

# Email (optional)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# JWT
JWT_SECRET=your-jwt-secret-key
```

---

## Quick Checklist ✅

Before testing payments:

- [ ] Razorpay account created
- [ ] Test API keys generated
- [ ] `.env.local` file created
- [ ] `RAZORPAY_KEY_ID` added
- [ ] `RAZORPAY_KEY_SECRET` added
- [ ] `razorpay` package installed (`npm install razorpay`)
- [ ] Server restarted
- [ ] Can access menu page
- [ ] Items added to cart
- [ ] Checkout page loads
- [ ] "Place Order" button clicked
- [ ] Razorpay modal opens 🎉

---

## Testing Workflow

### Successful Payment Test:

1. Add items to cart
2. Go to checkout
3. Fill: Name, Email, Phone, Table Number
4. Click "Place Order"
5. Razorpay modal opens
6. Enter test card: `4111 1111 1111 1111`
7. CVV: `123`, Expiry: `12/25`
8. OTP: `123456`
9. Payment succeeds ✅
10. Redirects to menu
11. Check dashboard - order appears
12. Check email - confirmation sent

---

## Production Deployment

When going live:

1. ✅ Complete Razorpay KYC
2. ✅ Get Live API keys
3. ✅ Update `.env.local` with live keys
4. ✅ Set up webhook with production URL
5. ✅ Test with real small amount
6. ✅ Enable in production

---

## Need Help?

1. **Check server logs**: Look for error messages
2. **Check browser console**: Press F12
3. **Razorpay docs**: https://razorpay.com/docs/
4. **Test mode**: Always test in test mode first!

---

## Summary

**Minimum required**:
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

**Then**:
1. Restart server
2. Test payment
3. Should work! 🚀

If you see "Payment gateway not configured", you missed step 3 (restart server)!
