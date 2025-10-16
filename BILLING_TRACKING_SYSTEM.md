# Billing History Tracking System - Complete Guide

**Date**: 2025-10-12  
**Status**: ✅ **IMPLEMENTATION GUIDE**

---

## 🎯 How Billing History Tracking Works

### Overview
Billing history is tracked through **two interconnected models**:

1. **Subscription Model** - Tracks subscription status, plan, and billing cycles
2. **Payment Model** - Tracks individual payment transactions (invoices)

---

## 📊 Data Flow Architecture

### Complete Payment Lifecycle

```
Customer Subscribes
    ↓
Razorpay Creates Subscription
    ↓
14-Day Trial Starts
    ↓
Trial Ends → First Payment Due
    ↓
Razorpay Charges Customer
    ↓
Razorpay Webhook: "subscription.charged" or "invoice.paid"
    ↓
Our Webhook Handler Receives Event
    ↓
Creates Payment Record in Database
    ↓
Updates Subscription Status
    ↓
Payment Appears in Billing History
    ↓
Monthly Recurring (Repeat from "Razorpay Charges")
```

---

## 🗄️ Database Models

### 1. Subscription Model
**Purpose**: Track overall subscription status and billing cycle

```typescript
{
  ownerId: ObjectId,              // User reference
  provider: 'razorpay',           // Payment provider
  razorpaySubscriptionId: String, // Razorpay subscription ID
  razorpayCustomerId: String,     // Razorpay customer ID
  plan: 'basic' | 'advance',      // Current plan
  planPricePaise: Number,         // Plan price in paise
  status: String,                 // trialing, active, cancelled, past_due, etc.
  trialEndsAt: Date,              // Trial expiration date
  currentPeriodStart: Date,       // Current billing period start
  currentPeriodEnd: Date,         // Current billing period end
  cancelAtPeriodEnd: Boolean,     // Cancel flag
  createdAt: Date,                // Created timestamp
  updatedAt: Date                 // Updated timestamp
}
```

**Lifecycle**:
- Created when user subscribes
- Status changes: `trialing` → `active` → `cancelled`/`past_due`
- Updated by webhooks on payment events

### 2. Payment Model
**Purpose**: Track individual payment transactions (billing history)

```typescript
{
  ownerId: ObjectId,              // User reference
  subscriptionId: ObjectId,       // Subscription reference
  razorpayPaymentId: String,      // Razorpay payment ID (unique)
  razorpayOrderId: String,        // Razorpay order ID
  razorpayInvoiceId: String,      // Razorpay invoice ID
  amount: Number,                 // Amount in paise (₹29.99 = 2999)
  currency: String,               // Currency code (INR)
  status: String,                 // created, authorized, captured, refunded, failed
  method: String,                 // card, upi, netbanking, wallet
  description: String,            // Payment description
  invoiceUrl: String,             // Link to invoice PDF
  paidAt: Date,                   // Payment timestamp
  createdAt: Date,                // Created timestamp
  updatedAt: Date                 // Updated timestamp
}
```

**Created By**:
- Razorpay webhook handler
- One record per successful payment
- Appears as "invoice" in billing history

---

## 🔄 Webhook Event Handling

### Subscription Events

#### 1. `subscription.activated`
**When**: Trial ends and first payment is authorized
**Action**:
- Update subscription status to `active`
- Set `currentPeriodStart` and `currentPeriodEnd`

#### 2. `subscription.charged` or `invoice.paid`
**When**: Customer is successfully charged (monthly recurring)
**Action**:
- Create new Payment record ✅ **(MAIN BILLING HISTORY)**
- Update subscription dates
- Update subscription status to `active`

```typescript
// Payment record created here
{
  ownerId: subscription.ownerId,
  subscriptionId: subscription._id,
  razorpayPaymentId: payment.id,
  razorpayInvoiceId: invoice.id,
  amount: invoice.amount,
  status: 'captured',
  paidAt: new Date(invoice.paid_at * 1000),
  invoiceUrl: invoice.invoice_url
}
```

#### 3. `payment.failed`
**When**: Payment fails (card declined, insufficient funds)
**Action**:
- Create Payment record with status `failed`
- Update subscription status to `past_due`
- Send notification to customer

#### 4. `subscription.cancelled`
**When**: Subscription is cancelled
**Action**:
- Update subscription status to `cancelled`
- Set `cancelAtPeriodEnd` to false
- No new Payment records created

---

## 📋 Billing History Display

### What Users See in `/dashboard/billing`

```
Payment History Table
┌────────────────┬──────────┬──────────┬──────────┬─────────┐
│ Payment ID     │ Date     │ Amount   │ Status   │ Actions │
├────────────────┼──────────┼──────────┼──────────┼─────────┤
│ pay_NkXXXXXX   │ Jan 12   │ ₹29.99   │ Captured │ Download│
│ pay_NkYYYYYY   │ Dec 12   │ ₹29.99   │ Captured │ Download│
│ pay_NkZZZZZZ   │ Nov 12   │ ₹29.99   │ Failed   │ Retry   │
└────────────────┴──────────┴──────────┴──────────┴─────────┘
```

**Data Source**: Payment model records
**Query**: 
```typescript
Payment.find({ ownerId: user.userId })
  .sort({ createdAt: -1 })
  .limit(50)
```

---

## 🔧 Implementation Status

### ✅ Already Implemented

1. **Subscription Model** - Complete
2. **Payment Model** - Complete
3. **Billing Status API** - `/api/billing/status`
4. **Payment History API** - `/api/billing/payments`
5. **Subscription API** - `/api/billing/subscribe`
6. **Cancel API** - `/api/billing/cancel`
7. **Webhook Handler** - `/api/webhooks/razorpay`

### ⚠️ Needs Implementation

1. **Webhook Payment Creation** - Currently logs but doesn't create Payment records
2. **Invoice URL Extraction** - Need to extract from Razorpay response
3. **Failed Payment Handling** - Create Payment records for failed payments

---

## 🔨 Required Updates

### 1. Update Webhook Handler

Currently, the webhook handles subscriptions but **doesn't create Payment records**.

**Need to add**:
```typescript
async function handleSubscriptionCharged(subEntity: any, paymentEntity: any) {
  // 1. Find subscription
  const subscription = await Subscription.findOne({ 
    razorpaySubscriptionId: subEntity.id 
  });
  
  // 2. Create Payment record
  await Payment.create({
    ownerId: subscription.ownerId,
    subscriptionId: subscription._id,
    razorpayPaymentId: paymentEntity.id,
    razorpayInvoiceId: subEntity.invoice_id,
    amount: paymentEntity.amount,
    currency: paymentEntity.currency,
    status: 'captured',
    method: paymentEntity.method,
    invoiceUrl: subEntity.invoice_url,
    paidAt: new Date(paymentEntity.created_at * 1000),
  });
  
  // 3. Update subscription
  await subscription.save();
}
```

### 2. Handle Failed Payments

```typescript
async function handlePaymentFailed(paymentEntity: any) {
  // Find subscription by payment ID
  const subscription = await Subscription.findOne({ 
    razorpayPaymentId: paymentEntity.id 
  });
  
  // Create failed Payment record
  await Payment.create({
    ownerId: subscription.ownerId,
    subscriptionId: subscription._id,
    razorpayPaymentId: paymentEntity.id,
    amount: paymentEntity.amount,
    status: 'failed',
    paidAt: new Date(),
  });
  
  // Update subscription status
  subscription.status = 'past_due';
  await subscription.save();
}
```

---

## 📊 Billing History Timeline

### Example User Journey

```
Day 1: Subscribe to Advance Plan
├─ Subscription created (status: trialing)
├─ No Payment record yet
└─ Billing History: Empty

Day 14: Trial Ends
├─ Razorpay charges ₹2,999
├─ Webhook: subscription.charged
├─ Payment record created ✅
├─ Subscription status: active
└─ Billing History: 1 record (₹29.99, Jan 1)

Day 44: First Renewal
├─ Razorpay charges ₹2,999
├─ Webhook: subscription.charged
├─ Payment record created ✅
└─ Billing History: 2 records

Day 74: Payment Fails
├─ Card declined
├─ Webhook: payment.failed
├─ Payment record created (status: failed) ✅
├─ Subscription status: past_due
└─ Billing History: 3 records (last one failed)

Day 75: Customer Updates Card
├─ Razorpay retries and succeeds
├─ Webhook: subscription.charged
├─ Payment record created ✅
├─ Subscription status: active
└─ Billing History: 4 records
```

---

## 🎯 Tracking Metrics

### What We Track

1. **Subscription Metrics**:
   - Total active subscriptions
   - Trial conversions
   - Churn rate
   - MRR (Monthly Recurring Revenue)

2. **Payment Metrics**:
   - Total revenue
   - Average order value
   - Payment success rate
   - Failed payment rate

3. **Per-User Metrics**:
   - Lifetime value
   - Payment history count
   - Days subscribed
   - Plan changes

### Queries

```typescript
// Total MRR
const activeSubs = await Subscription.countDocuments({ status: 'active' });
const basicCount = await Subscription.countDocuments({ 
  status: 'active', 
  plan: 'basic' 
});
const advanceCount = await Subscription.countDocuments({ 
  status: 'active', 
  plan: 'advance' 
});
const mrr = (basicCount * 999) + (advanceCount * 2999);

// Total Revenue
const payments = await Payment.aggregate([
  { $match: { status: 'captured' } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);
const totalRevenue = payments[0].total / 100;

// Payment Success Rate
const total = await Payment.countDocuments();
const successful = await Payment.countDocuments({ status: 'captured' });
const successRate = (successful / total) * 100;
```

---

## 🔐 Data Retention

### Storage Policy

- **Subscriptions**: Keep forever (historical record)
- **Payments**: Keep forever (tax/legal requirements)
- **Canceled Subscriptions**: Mark as cancelled, don't delete

### Privacy Compliance

- No credit card numbers stored
- Payment details managed by Razorpay
- Only transaction IDs and amounts stored
- Invoice PDFs hosted by Razorpay

---

## 📱 User Experience

### Billing Page Features

1. **Current Subscription Card**
   - Shows plan, status, renewal date
   - Manage and cancel buttons

2. **Payment History Table**
   - Lists all payments (invoices)
   - Download invoice button
   - Status badges (Paid, Failed, Pending)

3. **Empty States**
   - "No active subscription" - Show plans
   - "No payment history" - Message for trial users

---

## 🚀 Next Steps

### To Complete Billing History Tracking

1. ✅ Payment model created
2. ✅ Payments API endpoint created
3. ⚠️ Update webhook to create Payment records
4. ⚠️ Test with real Razorpay payments
5. ⚠️ Add invoice download functionality
6. ⚠️ Add payment retry for failed payments

---

## 📊 Summary

### How It Works

```
Billing History = Payment Model Records

Each record represents:
- One invoice
- One payment attempt
- One line in billing history table

Created by:
- Razorpay webhook handler
- On subscription.charged event
- On invoice.paid event
- On payment.failed event

Displayed in:
- /dashboard/billing page
- Payment History table
- Fetched via /api/billing/payments
```

### Key Points

✅ **Subscription Model** tracks overall status  
✅ **Payment Model** tracks each payment (billing history)  
✅ **Webhooks** automatically create records  
✅ **No manual intervention** needed  
✅ **Real-time updates** via webhooks  
✅ **Historical data** preserved forever  

---

**Billing History Tracking: DOCUMENTED** ✅

*Last Updated: 2025-10-12*  
*Status: Implementation Ready*
