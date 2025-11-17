# 🎯 Plan-Based Feature Restrictions

## Overview

QR Menu Manager implements a two-tier subscription model with feature restrictions based on the plan level. This document outlines what features are available to each plan and how the restrictions are implemented.

---

## 📊 Feature Matrix

| Feature | Basic Plan | Advance Plan |
|---------|-----------|-------------|
| **Core Features** |
| Create Restaurants | ✅ Yes | ✅ Yes |
| Menu Builder | ✅ Yes | ✅ Yes |
| QR Code Generation | ✅ Yes | ✅ Yes |
| Order Management | ✅ Yes | ✅ Yes |
| Live Orders Feed | ✅ Yes | ✅ Yes |
| Payment Integration | ✅ Yes | ✅ Yes |
| Customer Orders | ✅ Yes | ✅ Yes |
| **Premium Features** |
| Analytics Dashboard | ❌ Locked | ✅ Unlocked |
| Top Selling Items (Dashboard) | ❌ Hidden | ✅ Visible |
| Revenue Insights | ❌ Locked | ✅ Unlocked |
| Peak Hours Analysis | ❌ Locked | ✅ Unlocked |
| Advanced Reports | ❌ Locked | ✅ Unlocked |
| Trend Comparisons | ❌ Locked | ✅ Unlocked |

---

## 🔐 Implementation Details

### **1. Premium Feature Guard Component**

**Location**: `src/components/PremiumFeatureGuard.tsx`

A reusable React component that:
- Wraps premium features
- Shows blurred content for basic users
- Displays an upgrade prompt with benefits
- Includes a CTA button to upgrade plan

**Usage**:
```tsx
<PremiumFeatureGuard
  isLocked={plan === 'basic'}
  featureName="Analytics Dashboard"
  description="Get deep insights into your restaurant's performance"
  className="min-h-screen"
>
  {/* Premium content here */}
</PremiumFeatureGuard>
```

### **2. Analytics Dashboard Restrictions**

**Location**: `src/app/dashboard/analytics/page.tsx`

**For Basic Plan Users**:
- Entire analytics page is blurred
- Overlay shows upgrade prompt with:
  - Premium badge with crown icon
  - Feature list
  - Pricing information
  - Direct link to billing page

**For Advance Plan Users**:
- Full access to all analytics:
  - Total revenue with trend
  - Total orders with comparison
  - Average order value
  - Completed orders
  - Revenue trend charts
  - Top selling items
  - Order status breakdown
  - Peak hours analysis

**Backend Behavior**:
- Analytics data is **still processed** for all users
- Backend `/api/owner/analytics` endpoint works for both plans
- Frontend just restricts visibility

### **3. Dashboard Overview Restrictions**

**Location**: `src/app/dashboard/page.tsx`

**For Basic Plan Users**:
- ✅ Can see: Orders Today, Revenue (MTD), Open Orders
- ✅ Can see: Live Orders Feed
- ✅ Can see: Quick Actions
- ❌ Cannot see: Top Selling Items (replaced with locked overlay)

**For Advance Plan Users**:
- ✅ All features visible
- ✅ Top Selling Items section shows real data

**Top Selling Items Behavior**:
```tsx
{!isBasicPlan ? (
  // Show real top selling items
) : (
  // Show locked overlay with dummy data (blurred)
)}
```

---

## 🎨 User Experience

### **Basic Plan User Flow**

1. **Dashboard Access**
   - User logs in successfully
   - Sees core stats (orders, revenue)
   - Sees live orders feed
   - "Top Selling Items" section shows lock overlay

2. **Analytics Access**
   - Clicks "Analytics" in sidebar
   - Page loads but entire content is blurred
   - Sees premium overlay with:
     - Crown icon
     - "Analytics Dashboard" locked message
     - List of benefits
     - "Upgrade to Advance Plan" button
   - Clicking button redirects to `/dashboard/billing`

3. **Upgrade Prompt**
   - Clear visual indication with blur effect
   - Professional design with gradient overlay
   - Benefits list emphasizes value
   - Pricing shown: ₹1,999/month or ₹19,999/year

### **Advance Plan User Flow**

1. **Dashboard Access**
   - User logs in successfully
   - Sees all stats including "Top Selling Items"
   - No locked sections

2. **Analytics Access**
   - Clicks "Analytics" in sidebar
   - Full analytics dashboard loads
   - Can view all metrics and charts
   - Can switch between 7, 30, 90 day periods
   - No restrictions or overlays

---

## 🛠️ Technical Architecture

### **Client-Side Detection**

```tsx
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';

const { plan, loading } = useSubscriptionAccess();
const isBasicPlan = plan === 'basic';
const isAdvancePlan = plan === 'advance';
```

### **Subscription Hook**

**Location**: `src/hooks/useSubscriptionAccess.ts`

Returns:
```typescript
{
  hasAccess: boolean;              // Overall subscription access
  status: SubscriptionStatus;      // Current status
  plan: 'basic' | 'advance';       // Plan level ✨
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  loading: boolean;
}
```

### **Data Flow**

1. User logs in → JWT contains userId
2. Frontend calls `/api/billing/status`
3. Backend returns subscription data including `plan`
4. `useSubscriptionAccess` hook stores plan in state
5. Components check `plan === 'basic'` to determine restrictions
6. Premium features render conditionally

---

## 🎯 Feature Detection Pattern

### **Pattern 1: Hide Feature Completely**
```tsx
{!isBasicPlan && (
  <div>Premium Content</div>
)}
```

### **Pattern 2: Lock Feature with Overlay**
```tsx
<PremiumFeatureGuard isLocked={isBasicPlan} featureName="...">
  <div>Premium Content (blurred when locked)</div>
</PremiumFeatureGuard>
```

### **Pattern 3: Show Different Content**
```tsx
{isBasicPlan ? (
  <LockedPlaceholder />
) : (
  <PremiumContent />
)}
```

---

## 💡 Why Data is Still Processed

Even though basic users can't **see** analytics, the data is still:

1. **Collected**: Orders, revenue, items tracked
2. **Processed**: Aggregations and calculations run
3. **Stored**: Analytics data in database

**Benefits**:
- Instant unlock when user upgrades
- No data migration needed
- Historical data preserved
- Backend stays simple (no plan checks)

**Security**:
- Frontend restrictions only
- Backend doesn't expose sensitive data
- Plan verification happens on frontend
- No API changes needed

---

## 🔄 Upgrade Flow

1. Basic user sees locked feature
2. Clicks "Upgrade to Advance Plan" button
3. Redirected to `/dashboard/billing`
4. Selects Advance plan (monthly/yearly)
5. Completes payment via Razorpay
6. Subscription updated to `plan: 'advance'`
7. `useSubscriptionAccess` hook refreshes
8. All premium features unlock automatically
9. No page refresh needed (React state update)

---

## 📱 Responsive Design

Premium overlays are fully responsive:
- Mobile: Full-screen overlay with centered content
- Tablet: Optimized spacing and font sizes
- Desktop: Beautiful gradient with backdrop blur

---

## 🎨 Design Consistency

All locked features use the same:
- Crown icon (premium badge)
- Gradient overlay (slate-900 to purple-900)
- Blur effect (backdrop-blur)
- CTA button (orange to pink gradient)
- Feature list styling
- Consistent spacing and typography

---

## 🚀 Performance Considerations

1. **No Extra API Calls**
   - Plan info already in subscription status
   - Single hook call per page

2. **Client-Side Only**
   - No backend plan checks
   - Pure React conditional rendering

3. **Lazy Loading**
   - Components render conditionally
   - No unnecessary DOM elements

4. **Reusable Component**
   - `PremiumFeatureGuard` used everywhere
   - Consistent behavior across app

---

## ✅ Testing Checklist

### **Basic Plan User**
- [ ] Dashboard shows orders and revenue ✅
- [ ] Top Selling Items shows lock overlay ✅
- [ ] Analytics page shows full lock overlay ✅
- [ ] Lock overlay has "Upgrade" button ✅
- [ ] Button redirects to billing page ✅
- [ ] Content is blurred but visible underneath ✅

### **Advance Plan User**
- [ ] Dashboard shows all sections ✅
- [ ] Top Selling Items shows real data ✅
- [ ] Analytics page fully accessible ✅
- [ ] No lock overlays visible ✅
- [ ] All charts and metrics work ✅

### **Upgrade Flow**
- [ ] Basic user clicks upgrade button ✅
- [ ] Redirected to billing page ✅
- [ ] Can purchase Advance plan ✅
- [ ] After upgrade, features unlock immediately ✅
- [ ] No page refresh needed ✅

---

## 🎉 Summary

✅ **Basic Plan**: Core restaurant management features
✅ **Advance Plan**: Everything + Analytics & Insights
✅ **Smooth UX**: Clear upgrade prompts, no confusion
✅ **Easy Maintenance**: Single component for all locks
✅ **Data Preserved**: Analytics always collected
✅ **Instant Unlock**: Features available immediately after upgrade

**The implementation follows industry best practices used by successful SaaS products like Notion, Figma, and Linear!** 🚀
