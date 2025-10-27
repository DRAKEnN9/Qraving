# 🔄 Razorpay Autopay Complete Setup Guide

## 📋 **Overview**

Razorpay's autopay (recurring payments) allows automatic billing without user intervention. Your system is now configured to handle recurring subscriptions seamlessly.

## ✅ **What's Already Configured in Your Code**

### **1. Subscription Creation with Autopay**
**File**: `src/app/api/billing/subscribe/route.ts`

```javascript
{
  plan_id: planId,
  total_count: 120,        // 10 years of billing cycles
  customer_notify: 1,      // Email/SMS notifications enabled
  quantity: 1,
  notify_info: {
    notify_email: email,   // Customer email for notifications
    notify_phone: contact, // Customer phone for SMS
  }
}
```

### **2. Recurring Payment Webhooks**
**File**: `src/app/api/webhooks/razorpay/route.ts`

**Handles**:
- ✅ `subscription.charged` → Updates billing period, keeps subscription active
- ✅ `payment.failed` → Marks subscription as `past_due`
- ✅ `invoice.paid` → Confirms successful recurring payment
- ✅ Auto period updates → `currentPeriodStart` and `currentPeriodEnd` updated on each charge

### **3. Automatic Payment Flow**
```
Month 1: Initial payment → active
Month 2: Auto-charge via Razorpay → subscription.charged webhook → period updated
Month 3: Auto-charge → subscription.charged → period updated
... (continues automatically)
```

## 🔧 **Razorpay Dashboard Setup (Step-by-Step)**

### **Step 1: Enable Recurring Payments**
1. **Log in to Razorpay Dashboard**: https://dashboard.razorpay.com
2. **Navigate to**: Settings → API Keys
3. **Generate API Keys** (if not already done):
   - Test Mode keys for development
   - Live Mode keys for production
4. **Copy keys** to your `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxx
   ```

### **Step 2: Create Subscription Plans**

1. **Navigate to**: Subscriptions → Plans
2. **Create 4 Plans**:

#### **Plan 1: Basic Monthly**
```
Plan Name: Essential Monthly
Plan ID: plan_basic_monthly (copy this)
Billing Amount: ₹1,499
Billing Interval: 1 month
```

#### **Plan 2: Basic Yearly**
```
Plan Name: Essential Yearly
Plan ID: plan_basic_yearly (copy this)
Billing Amount: ₹14,999
Billing Interval: 1 year
```

#### **Plan 3: Advance Monthly**
```
Plan Name: Professional Monthly
Plan ID: plan_advance_monthly (copy this)
Billing Amount: ₹1,999
Billing Interval: 1 month
```

#### **Plan 4: Advance Yearly**
```
Plan Name: Professional Yearly
Plan ID: plan_advance_yearly (copy this)
Billing Amount: ₹19,999
Billing Interval: 1 year
```

3. **Copy Plan IDs** to your `.env`:
```env
RAZORPAY_PLAN_BASIC_MONTHLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_BASIC_YEARLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_ADVANCE_MONTHLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_ADVANCE_YEARLY=plan_xxxxxxxxxxxxx
```

### **Step 3: Configure Webhooks**

1. **Navigate to**: Settings → Webhooks
2. **Create New Webhook**:
   - **Webhook URL**: `https://your-domain.com/api/webhooks/razorpay`
   - **Active Events**: Select ALL of these:

#### **Required Webhook Events**
```
✅ subscription.authenticated   (Trial starts)
✅ subscription.activated       (Subscription activates)
✅ subscription.charged         (Recurring payment successful)
✅ subscription.pending         (Payment pending)
✅ subscription.halted          (Auto-retry failed)
✅ subscription.cancelled       (User cancelled)
✅ subscription.paused          (User paused)
✅ subscription.resumed         (User resumed)
✅ subscription.completed       (One-time payment completed)
✅ subscription.updated         (Plan changed)

✅ payment.authorized           (First payment authorized)
✅ payment.captured             (Payment captured)
✅ payment.failed               (Payment failed)

✅ invoice.paid                 (Invoice paid)
✅ invoice.partially_paid       (Partial payment)
✅ invoice.expired              (Invoice expired)
```

3. **Set Webhook Secret**:
   - After creating webhook, Razorpay generates a secret
   - Copy to your `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxx
   ```

4. **Test Webhook**:
   - Use Razorpay's webhook testing tool
   - Send test events to verify your endpoint works

### **Step 4: Enable Auto-Debit Features**

1. **Navigate to**: Settings → Payment Methods
2. **Enable Auto-Debit** methods:
   - ✅ UPI Autopay (Recommended - works with all UPI apps)
   - ✅ Cards (For credit/debit card autopay)
   - ✅ Emandate (For bank account autopay)
   - ✅ Nach (For corporate accounts)

3. **Set Retry Logic**:
   - Navigate to: Subscriptions → Settings
   - Enable **Auto Retry** for failed payments
   - Configure retry schedule:
     ```
     Retry 1: After 1 day
     Retry 2: After 3 days
     Retry 3: After 5 days
     Total: 3 attempts over 9 days
     ```

### **Step 5: Configure Customer Notifications**

1. **Navigate to**: Settings → Emails & SMS
2. **Enable Notifications**:
   - ✅ Payment Success (Email + SMS)
   - ✅ Payment Failed (Email + SMS)
   - ✅ Upcoming Charge Reminder (3 days before)
   - ✅ Trial Ending Reminder (3 days before trial end)
   - ✅ Subscription Cancelled (Email)

3. **Customize Templates** (Optional):
   - Add your logo and brand colors
   - Customize email text

## 🎯 **How Autopay Works**

### **Initial Subscription (First Payment)**
```
1. User clicks "Subscribe" on your website
2. Razorpay Checkout opens → User authorizes UPI autopay
3. First payment deducted immediately
4. Webhook: subscription.authenticated OR subscription.completed
5. Your DB: status = 'active' or 'trialing'
6. User gets dashboard access
```

### **Recurring Payments (Automatic)**
```
--- Monthly Billing Cycle ---
Day 1 (Month 1): Initial payment ✅
Day 30 (Month 2): Auto-charge → subscription.charged webhook → period updated ✅
Day 60 (Month 3): Auto-charge → subscription.charged → period updated ✅
Day 90 (Month 4): Auto-charge → subscription.charged → period updated ✅
... (continues until user cancels)

--- Yearly Billing Cycle ---
Day 1 (Year 1): Initial payment ✅
Day 365 (Year 2): Auto-charge → subscription.charged webhook → period updated ✅
Day 730 (Year 3): Auto-charge → subscription.charged → period updated ✅
... (continues until user cancels)
```

### **Payment Failure Handling**
```
Charge Due → Payment Fails → payment.failed webhook → status: 'past_due'
  ↓
Retry 1 (Day +1) → Still fails → status: 'past_due' (user keeps access)
  ↓
Retry 2 (Day +3) → Still fails → status: 'past_due'
  ↓
Retry 3 (Day +5) → Success! → subscription.charged → status: 'active'
  OR
  → Final failure → subscription.halted → status: 'halted' (access blocked)
```

## 🔐 **UPI Autopay Registration**

### **User Experience**
1. User selects UPI as payment method
2. Razorpay shows UPI autopay consent screen:
   ```
   "Authorize QR Menu Manager to auto-debit ₹1,999/month"
   [Approve] [Decline]
   ```
3. User enters UPI PIN to approve
4. Autopay mandate registered with user's bank
5. Future charges happen automatically (no UPI PIN needed)

### **Supported UPI Apps**
- ✅ Google Pay
- ✅ PhonePe
- ✅ Paytm
- ✅ BHIM
- ✅ Amazon Pay
- ✅ Any UPI-enabled banking app

## 📊 **Monitoring Recurring Payments**

### **Razorpay Dashboard**
1. **Navigate to**: Subscriptions → All Subscriptions
2. **View for each subscription**:
   - Billing history
   - Upcoming charge date
   - Payment method
   - Auto-retry status
   - Customer details

### **Your Application**
**Check subscription details**:
```bash
GET /api/billing/status
Response:
{
  "status": "active",
  "currentPeriodStart": "2025-10-24T...",
  "currentPeriodEnd": "2025-11-24T...",  # Next charge date
  "plan": "advance",
  "interval": "monthly"
}
```

## 🚨 **Handling Edge Cases**

### **1. Customer Changes Payment Method**
- User can update card/UPI in Razorpay customer portal
- Your webhook automatically receives update
- No code changes needed

### **2. Customer's Card Expires**
- Razorpay sends notification to customer
- Customer updates card before next billing cycle
- Auto-retry logic handles expired cards gracefully

### **3. Insufficient Balance**
- Payment fails → `payment.failed` webhook
- Status set to `past_due` (user keeps access during retry period)
- Auto-retry after 1, 3, 5 days
- If all retries fail → `subscription.halted` → access blocked

### **4. Customer Cancels Mid-Cycle**
```javascript
// Your cancel API sets cancelAtPeriodEnd
if (cancelAtPeriodEnd) {
  // User keeps access until current period ends
  // No more charges after that
} else {
  // Immediate cancellation
  // Access removed right away
}
```

## ✅ **Testing Autopay**

### **Test Mode Testing**
1. **Use Razorpay test credentials**
2. **Test UPI**: Use UPI ID `success@razorpay`
3. **Test Card**: `4111 1111 1111 1111` (any CVV, future expiry)
4. **Test scenarios**:
   - Successful recurring charge
   - Failed payment (use `fail@razorpay`)
   - Trial → Paid conversion
   - Subscription cancellation

### **Production Testing**
1. Create a ₹1 test plan for real testing
2. Subscribe with your own UPI/card
3. Wait for first auto-charge (or use "Charge Now" in dashboard)
4. Verify webhook updates your DB correctly

## 📱 **Customer Communication**

### **What to Tell Your Customers**
```
✅ "Your subscription will auto-renew on [date]"
✅ "You'll receive an email reminder 3 days before charging"
✅ "You can cancel anytime - no questions asked"
✅ "If payment fails, we'll retry 3 times before pausing service"
✅ "Update your payment method anytime in Account Settings"
```

### **Email Templates** (You should send)
**After successful subscription**:
```
Subject: Welcome to QR Menu Manager Pro! 🎉

Your subscription is active:
- Plan: Professional Yearly
- Amount: ₹19,999/year
- Next billing: Oct 24, 2026
- Auto-renew: Enabled

[Manage Subscription] [Update Payment Method] [Cancel]
```

**Before renewal**:
```
Subject: Your subscription renews in 3 days

Hi [Name],

Your QR Menu Manager subscription will auto-renew on Nov 24, 2025.
Amount: ₹1,999

[View Invoice] [Update Payment] [Cancel Subscription]
```

## 🛠️ **Environment Variables Checklist**

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxx

# Plan IDs (from Razorpay Dashboard)
RAZORPAY_PLAN_BASIC_MONTHLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_BASIC_YEARLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_ADVANCE_MONTHLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_ADVANCE_YEARLY=plan_xxxxxxxxxxxxx

# Webhook Secret (from Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 🎉 **Result**

After this setup:
- ✅ **Users subscribe once** → Auto-charged every month/year
- ✅ **No manual intervention** → Completely automated billing
- ✅ **Graceful failure handling** → Retries + customer notifications
- ✅ **Seamless experience** → Users never have to re-enter payment details
- ✅ **Full visibility** → You see all transactions in Razorpay Dashboard
- ✅ **Professional** → Automated emails keep customers informed

**Your autopay system is production-ready!** 🚀

## 📞 **Support Resources**

- **Razorpay Docs**: https://razorpay.com/docs/payments/subscriptions/
- **UPI Autopay Guide**: https://razorpay.com/docs/payments/upi-autopay/
- **Webhook Guide**: https://razorpay.com/docs/webhooks/
- **Test Credentials**: https://razorpay.com/docs/payments/test-cards/

---

**Next Steps**:
1. Create plans in Razorpay Dashboard
2. Configure webhook with all events
3. Test with test credentials
4. Go live with production keys! 🎉
