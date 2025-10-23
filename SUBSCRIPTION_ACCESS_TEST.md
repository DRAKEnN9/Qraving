# 🔒 Subscription Access Control - Test Guide

## ✅ Fixed Issues

### **Root Cause**
The subscription access logic had several flaws:
1. **Cancelled subscriptions**: Were still granting access when they shouldn't
2. **Trial cancellations**: Weren't being handled properly
3. **Client/server logic mismatch**: Different access logic on frontend vs backend

### **Fixes Applied**

#### 1. **Server-Side Access Logic** (`src/lib/subscription.server.ts`)
- ✅ **Trial status**: Access only until trial ends
- ✅ **Active status**: Full access
- ✅ **Cancelled status**: Access ONLY if `cancelAtPeriodEnd=true` AND `currentPeriodEnd` is in the future
- ✅ **All other statuses**: No access

#### 2. **Client-Side Logic** (`src/hooks/useSubscriptionAccess.ts`)
- ✅ **Matched server logic exactly** to prevent inconsistencies
- ✅ **Added detailed logging** for debugging

#### 3. **Cancellation Logic** (`src/app/api/billing/cancel/route.ts`)
- ✅ **Immediate cancellation**: Sets `status='cancelled'`, `cancelAtPeriodEnd=false`, clears `currentPeriodEnd`
- ✅ **Period-end cancellation**: Sets `cancelAtPeriodEnd=true`, keeps status as 'active' until period end
- ✅ **Trial cancellation**: Always immediate, no period end consideration

## 🧪 Testing Steps

### **Step 1: Check Current Subscription Status**
```bash
# Visit this URL while logged in:
http://localhost:3000/api/debug/subscription-status
```

**Expected Response**: Should show your current subscription details and access logic explanation.

### **Step 2: Test Protected API Access**
```bash
# Visit this URL while logged in:
http://localhost:3000/api/test-protected
```

**If you have valid subscription**: `✅ Access granted!`
**If subscription is cancelled**: `402 Payment Required` error

### **Step 3: Test Dashboard Access**
1. **Navigate to**: `http://localhost:3000/dashboard`
2. **Expected behavior**:
   - **Valid subscription**: Dashboard loads normally
   - **Cancelled subscription**: Redirected to `/?subscription=expired`

### **Step 4: Cancel Subscription Test**

#### **For Immediate Cancellation:**
1. Go to `/dashboard/billing`
2. Click "Cancel Subscription"
3. Choose **"Cancel Now"** (not "Cancel at Period End")
4. Enter password and confirm
5. **Expected**: Redirected to homepage, lose access immediately

#### **For Period-End Cancellation:**
1. Go to `/dashboard/billing`
2. Click "Cancel Subscription"  
3. Choose **"Cancel at Period End"**
4. Enter password and confirm
5. **Expected**: Access continues until billing period ends

## 🔍 Debug Information

### **Check Browser Console Logs**
Look for these debug messages:
```javascript
// Server-side logs (in terminal)
Subscription access check: {
  ownerId: "...",
  status: "cancelled",
  cancelAtPeriodEnd: false,
  hasValidAccess: false  // Should be false for cancelled
}

// Client-side logs (in browser)
Client subscription access check: {
  status: "cancelled",
  hasValidAccess: false  // Should match server
}

SubscriptionGuard check: {
  hasAccess: false,  // Should be false
  status: "cancelled"
}
```

### **Check Network Tab**
- `/api/billing/status` should return `status: "cancelled"`
- Protected APIs should return `402 Payment Required`

## 🛠️ If Access Control Still Not Working

### **1. Clear All Caches**
```bash
# Stop dev server
# Delete cache
rm -rf .next
# Restart
npm run dev
```

### **2. Check Browser Storage**
- Open DevTools → Application → Local Storage
- Clear `token` if needed to force re-authentication

### **3. Verify Database State**
Check your MongoDB subscription document:
```javascript
// Should look like this for cancelled subscription:
{
  status: "cancelled",
  cancelAtPeriodEnd: false,  // For immediate cancellation
  currentPeriodEnd: undefined  // Cleared for immediate cancellation
}
```

### **4. Manual Test Endpoints**

#### **A. Check Raw Subscription Data**
```
GET /api/debug/subscription-status
```

#### **B. Test API Protection**
```
GET /api/test-protected
```

#### **C. Test Owner APIs** (should all return 402)
```
GET /api/owner/restaurant
GET /api/owner/orders  
GET /api/owner/menu-items
```

## 🎯 Expected Behavior Summary

| Subscription Status | cancelAtPeriodEnd | currentPeriodEnd | Should Have Access |
|-------------------|------------------|------------------|-------------------|
| `trialing` | - | - | ✅ Until trial ends |
| `active` | - | - | ✅ Yes |
| `cancelled` | `false` | - | ❌ No (immediate cancellation) |
| `cancelled` | `true` | Future date | ✅ Until period end |
| `cancelled` | `true` | Past date | ❌ No (period ended) |
| `past_due` | - | - | ❌ No |
| `incomplete` | - | - | ❌ No |

## 🚨 Red Flags to Look For

1. **Still accessing dashboard after cancellation**: Check console logs for access logic
2. **APIs returning 200 instead of 402**: Subscription guard not working  
3. **No redirect after cancellation**: Client-side logic issue
4. **Inconsistent behavior**: Server/client logic mismatch

## ✅ Success Indicators

1. **Immediate cancellation**: Lose access right away, redirect to homepage
2. **Protected APIs**: Return 402 Payment Required
3. **Dashboard**: Redirects to `/?subscription=expired`
4. **Console logs**: Show `hasAccess: false` for cancelled subscriptions

---

**If you're still having issues after following this guide, please share:**
1. Console logs from browser DevTools
2. Response from `/api/debug/subscription-status`
3. Network tab showing API responses
