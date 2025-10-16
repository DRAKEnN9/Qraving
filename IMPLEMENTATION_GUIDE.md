# UPI Payment Implementation Guide

## ✅ What We've Done

1. ✅ Created UPI utility functions (`src/lib/upiPayment.ts`)
2. ✅ Updated Restaurant model with `paymentInfo.upiId`
3. ✅ Updated Order model (already has `paymentStatus` field)

## 🔧 What Needs to Be Done

### Step 1: Fix Checkout Page

The checkout page (`src/app/checkout/[slug]/page.tsx`) needs complete rewrite for UPI.

**Replace the entire `handlePlaceOrder` function with:**

```typescript
const handlePlaceOrder = async () => {
  if (!customerName || !customerEmail) {
    toast.error('Please fill in all required fields');
    return;
  }

  if (!tableNumber) {
    toast.error('Please enter your table number');
    return;
  }

  if (!restaurant) return;

  // Check if restaurant has UPI ID configured
  if (!restaurant.paymentInfo?.upiId) {
    toast.error('Restaurant payment not configured. Please contact restaurant.');
    return;
  }

  setLoading(true);

  try {
    // Create order with pending payment status
    const orderResponse = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantId: restaurant._id,
        customerName,
        customerEmail,
        customerPhone,
        tableNumber,
        notes,
        paymentMethod: 'upi',
        paymentStatus: 'pending', // Mark as pending
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          priceCents: item.priceCents,
          quantity: item.quantity,
          modifiers: item.modifiers || [],
        })),
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      throw new Error(error.error || 'Failed to create order');
    }

    const order = await orderResponse.json();
    
    // Generate UPI payment link
    import { generateUPILink, formatUPIAmount } from '@/lib/upiPayment';
    
    const upiLink = generateUPILink({
      upiId: restaurant.paymentInfo.upiId,
      payeeName: restaurant.name,
      amount: formatUPIAmount(getTotalPrice()),
      transactionNote: `Order #${order.orderId}`,
      transactionRef: order.orderId,
    });

    // Clear cart
    clearCart();
    
    // Redirect to UPI payment
    window.location.href = upiLink;
    
    // Show success message
    toast.success('Order placed! Complete payment in your UPI app.');
    
    // Redirect to order confirmation page after 2 seconds
    setTimeout(() => {
      router.push(`/order/${order.orderId}`);
    }, 2000);

  } catch (err: any) {
    console.error('Order error:', err);
    toast.error(err.message || 'Failed to place order');
    setLoading(false);
  }
};
```

### Step 2: Update Order Creation API

Update `src/app/api/orders/create/route.ts`:

```typescript
// Add support for UPI payment method
const paymentMethod = body.paymentMethod || 'card';
const paymentStatus = body.paymentStatus || 'pending';

const order = new Order({
  restaurantId,
  items: validatedItems,
  totalCents,
  currency: 'INR',
  customerName,
  customerEmail,
  customerPhone,
  tableNumber,
  notes,
  paymentMethod, // 'upi' or 'card'
  paymentStatus, // 'pending', 'succeeded', etc.
  status: 'pending',
});
```

### Step 3: Add Restaurant UPI Settings Page

Create a settings page where restaurants can add their UPI ID:

```typescript
// src/app/dashboard/restaurants/[id]/settings/page.tsx

<div>
  <label>UPI ID</label>
  <input
    type="text"
    value={formData.paymentInfo?.upiId || ''}
    onChange={(e) => setFormData(prev => ({
      ...prev,
      paymentInfo: {
        ...prev.paymentInfo,
        upiId: e.target.value
      }
    }))}
    placeholder="restaurant@paytm"
  />
  <p>Example: yourname@paytm, yourname@ybl</p>
</div>
```

### Step 4: Update Payment Method Selection in Checkout

```tsx
{/* Payment Method - UPI Only */}
<div className="rounded-lg border bg-white p-6 shadow-sm">
  <h2 className="mb-4 text-xl font-bold text-gray-900">Payment Method</h2>
  
  <div className="flex items-center gap-4 p-4 border-2 border-indigo-500 rounded-lg bg-indigo-50">
    <div className="text-4xl">💳</div>
    <div className="flex-1">
      <p className="font-semibold text-gray-900">UPI Payment</p>
      <p className="text-sm text-gray-600">
        Pay directly to {restaurant.name} via UPI
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Works with: GPay, PhonePe, Paytm, BHIM, etc.
      </p>
    </div>
  </div>
</div>
```

## 📱 How UPI Payment Works

### User Flow:
```
1. Customer fills checkout form
2. Clicks "Place Order & Pay"
3. Order created with status: "Payment Pending"
4. UPI link opens customer's UPI app (GPay/PhonePe/Paytm)
5. Customer completes payment to restaurant's UPI ID
6. Money goes DIRECTLY to restaurant
7. Restaurant sees order in dashboard (marked "Payment Pending")
8. Restaurant confirms payment received → marks order as "Paid"
9. Restaurant prepares food
```

### Technical Flow:
```
Customer -> Your App -> UPI Deep Link -> Customer's UPI App
                                           ↓
                                    Restaurant's Bank Account
                                    (Money received instantly)
```

## ❓ Do You Need PhonePe API?

**NO!** ❌

UPI deep links work with ALL UPI apps without any API:
- ✅ Google Pay
- ✅ PhonePe
- ✅ Paytm
- ✅ BHIM
- ✅ Amazon Pay
- ✅ WhatsApp Pay
- ✅ All bank UPI apps

The link format: `upi://pay?pa=restaurant@paytm&pn=RestaurantName&am=500.00...`

This is a STANDARD that all UPI apps support!

## 🎯 Next Steps

1. Fix the checkout page with the new handlePlaceOrder function
2. Update payment method UI to show "UPI Payment"
3. Test with a restaurant that has UPI ID configured
4. Add order confirmation page showing payment instructions

## 💡 Optional Enhancements

1. **QR Code**: Show UPI QR code on desktop (use `qrcode` package)
2. **Payment Confirmation**: Add manual payment confirmation button for restaurants
3. **Payment Screenshot**: Let customers upload payment proof
4. **Auto-remind**: Send email/SMS to restaurant when order placed

Would you like me to implement any of these?
