# 📱 Menu Access & QR Code Guide

## Issue 1: Cannot See Menu ❌

### Problem
You're using the wrong URL format:
```
❌ Wrong: http://localhost:3000/menu/68dbdadb44191a2de6b55ee7
✅ Correct: http://localhost:3000/menu/your-restaurant-slug
```

### Solution

#### Step 1: Find Your Restaurant Slug
Visit this URL in your browser:
```
http://localhost:3000/api/debug/restaurants
```

This will show you all restaurants with their correct slugs and menu URLs.

#### Step 2: Use the Correct URL
Copy the `menuUrl` from the debug response and use that.

Example response:
```json
{
  "count": 1,
  "restaurants": [
    {
      "_id": "68dbdadb44191a2de6b55ee7",
      "name": "My Restaurant",
      "slug": "my-restaurant",
      "menuUrl": "http://localhost:3000/menu/my-restaurant",
      "hasQRCode": true
    }
  ]
}
```

Then visit: `http://localhost:3000/menu/my-restaurant`

---

## Issue 2: QR Code Not Working on Mobile 📱

### Problem
When testing locally, `localhost:3000` only works on the same device. Your mobile phone cannot access `localhost` on your computer.

### Solutions

#### Option A: Use ngrok (Easiest for Testing) ⚡

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update .env.local:**
   ```bash
   APP_URL=https://abc123.ngrok.io
   ```

6. **Restart your server** and regenerate QR codes

7. **Scan QR code** - it will now work on mobile! 📱

#### Option B: Use Local Network IP (Same WiFi Only) 📶

1. **Find your computer's IP address:**

   **Windows:**
   ```bash
   ipconfig
   ```
   Look for `IPv4 Address` (e.g., 192.168.1.100)

   **Mac/Linux:**
   ```bash
   ifconfig | grep inet
   ```

2. **Update .env.local:**
   ```bash
   APP_URL=http://192.168.1.100:3000
   ```

3. **Restart your server**

4. **On mobile (connected to same WiFi):**
   ```
   http://192.168.1.100:3000/menu/your-restaurant-slug
   ```

⚠️ **Note:** Both devices must be on the same WiFi network

#### Option C: Deploy to Production (Best for Real Use) 🚀

Deploy to Vercel/Netlify/Railway with a real domain:
```bash
APP_URL=https://yourdomain.com
```

---

## Quick Troubleshooting

### Menu Shows "Restaurant not found"
- ✅ Check you're using the slug, not the ID
- ✅ Verify slug exists: http://localhost:3000/api/debug/restaurants
- ✅ Ensure restaurant was created successfully

### Menu Shows No Categories/Items
- ✅ Go to dashboard and add categories
- ✅ Add menu items to categories
- ✅ Mark items as "orderable"

### QR Code Shows Wrong URL
1. Update `APP_URL` in `.env.local`
2. Restart server
3. Go to restaurant settings
4. The QR code will be regenerated with correct URL

### Mobile Can't Access localhost
- Use ngrok (Option A above)
- Or use local IP (Option B above)
- Both devices must be on same network for IP method

---

## Testing Checklist

### On Desktop ✅
- [ ] Can access menu via slug
- [ ] Can see categories and items
- [ ] Can add items to cart
- [ ] Can checkout

### On Mobile (Same WiFi) 📱
- [ ] Can access via IP address
- [ ] QR code scans successfully
- [ ] Menu loads on mobile
- [ ] Can complete order on mobile

### On Mobile (Anywhere) 🌍
- [ ] Can access via ngrok URL
- [ ] QR code works from anywhere
- [ ] Full checkout flow works

---

## Example URLs

```bash
# Wrong ❌
http://localhost:3000/menu/68dbdadb44191a2de6b55ee7

# Correct ✅
http://localhost:3000/menu/pizza-palace
http://192.168.1.100:3000/menu/pizza-palace
https://abc123.ngrok.io/menu/pizza-palace
```

---

## Need Help?

1. **Check debug endpoint:** http://localhost:3000/api/debug/restaurants
2. **Verify slug exists** in database
3. **Ensure APP_URL** is set correctly
4. **Use ngrok** for mobile testing
