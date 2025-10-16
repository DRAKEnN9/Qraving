# API Quick Reference Guide

## 🔐 Authentication

All protected routes require the `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📍 Key Endpoints

### 1. Settings Management

#### Get Restaurant Settings
```http
GET /api/owner/restaurant
Authorization: Bearer <token>

Response 200:
{
  "restaurants": [{
    "_id": "...",
    "name": "My Restaurant",
    "description": "Best food in town",
    "address": "123 Main St",
    "phone": "+1234567890",
    "email": "contact@restaurant.com",
    "settings": {
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "openingHours": "9:00 AM - 10:00 PM"
    },
    "paymentInfo": {
      "upiId": "restaurant@paytm",
      "accountHolderName": "Restaurant Name"
    }
  }]
}
```

#### Update Restaurant Settings
```http
PATCH /api/owner/restaurant/settings
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "restaurantId": "restaurant_id_here",
  "settings": {
    "name": "Updated Restaurant Name",
    "description": "New description",
    "address": "456 New St",
    "phone": "+1987654321",
    "email": "new@restaurant.com",
    "currency": "USD",
    "timezone": "America/New_York",
    "openingHours": "10:00 AM - 11:00 PM"
  }
}

Response 200:
{
  "message": "Settings updated successfully",
  "restaurant": { ... }
}
```

---

### 2. Category Reordering

#### Reorder Categories
```http
POST /api/owner/categories/reorder
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "restaurantId": "restaurant_id_here",
  "categories": [
    { "id": "category_1_id", "order": 0 },
    { "id": "category_2_id", "order": 1 },
    { "id": "category_3_id", "order": 2 }
  ]
}

Response 200:
{
  "message": "Categories reordered successfully"
}
```

---

### 3. Dashboard Overview Data

#### Get Orders for Dashboard
```http
GET /api/owner/orders?restaurantId=<restaurant_id>
Authorization: Bearer <token>

Response 200:
{
  "orders": [
    {
      "_id": "order_id",
      "orderNumber": "ORD12345",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "tableNumber": 5,
      "status": "pending",
      "items": [
        {
          "name": "Burger",
          "quantity": 2,
          "priceCents": 599
        }
      ],
      "totalCents": 1198,
      "createdAt": "2025-01-12T12:00:00.000Z"
    }
  ]
}
```

#### Update Order Status
```http
PATCH /api/owner/orders/<order_id>/status
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "status": "preparing"
}
// Valid statuses: "pending", "preparing", "completed", "cancelled"

Response 200:
{
  "message": "Order status updated successfully",
  "order": { ... }
}
```

---

### 4. Analytics

#### Get Restaurant Analytics
```http
GET /api/owner/analytics?restaurantId=<restaurant_id>&startDate=<ISO_date>&endDate=<ISO_date>
Authorization: Bearer <token>

Response 200:
{
  "analytics": {
    "totalOrders": 150,
    "totalRevenue": 75000,
    "averageOrderValue": 500,
    "topSellingItems": [
      { "name": "Burger", "count": 45, "revenue": 22500 }
    ],
    "ordersByStatus": {
      "pending": 5,
      "preparing": 3,
      "completed": 140,
      "cancelled": 2
    },
    "revenueByDate": [
      { "date": "2025-01-01", "revenue": 5000 },
      { "date": "2025-01-02", "revenue": 6000 }
    ]
  }
}
```

---

### 5. Menu Management

#### Get All Menu Items
```http
GET /api/owner/menu-items?restaurantId=<restaurant_id>
Authorization: Bearer <token>

Response 200:
{
  "menuItems": [
    {
      "_id": "item_id",
      "name": "Burger",
      "description": "Delicious beef burger",
      "priceCents": 599,
      "categoryId": "category_id",
      "imageUrl": "https://...",
      "isAvailable": true,
      "isVegetarian": false
    }
  ]
}
```

#### Create Menu Item
```http
POST /api/owner/menu-items
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "restaurantId": "restaurant_id",
  "categoryId": "category_id",
  "name": "New Dish",
  "description": "Tasty dish",
  "priceCents": 799,
  "imageUrl": "https://...",
  "isAvailable": true,
  "isVegetarian": false
}

Response 201:
{
  "message": "Menu item created successfully",
  "menuItem": { ... }
}
```

#### Update Menu Item
```http
PATCH /api/owner/menu-items/<item_id>
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "Updated Dish Name",
  "priceCents": 899,
  "isAvailable": false
}

Response 200:
{
  "message": "Menu item updated successfully",
  "menuItem": { ... }
}
```

#### Delete Menu Item
```http
DELETE /api/owner/menu-items/<item_id>
Authorization: Bearer <token>

Response 200:
{
  "message": "Menu item deleted successfully"
}
```

---

### 6. Category Management

#### Get Categories
```http
GET /api/owner/categories?restaurantId=<restaurant_id>
Authorization: Bearer <token>

Response 200:
{
  "categories": [
    {
      "_id": "category_id",
      "name": "Appetizers",
      "order": 0,
      "restaurantId": "restaurant_id"
    }
  ]
}
```

#### Create Category
```http
POST /api/owner/categories
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "restaurantId": "restaurant_id",
  "name": "Desserts",
  "order": 3
}

Response 201:
{
  "message": "Category created successfully",
  "category": { ... }
}
```

---

### 7. Billing & Subscription

#### Get Subscription Status
```http
GET /api/billing/status
Authorization: Bearer <token>

Response 200:
{
  "status": "active",
  "plan": "pro",
  "currentPeriodEnd": "2025-02-12T00:00:00.000Z",
  "cancelAtPeriodEnd": false
}
```

#### Create Subscription
```http
POST /api/billing/subscribe
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "plan": "pro"
}

Response 200:
{
  "message": "Subscription created successfully",
  "subscription": { ... }
}
```

---

## 🧪 Testing with cURL

### Example: Login and Get Token
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123"
  }'

# Response includes token
# Use token in subsequent requests
```

### Example: Get Restaurants
```bash
curl http://localhost:3000/api/owner/restaurant \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Example: Update Settings
```bash
curl -X PATCH http://localhost:3000/api/owner/restaurant/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "RESTAURANT_ID",
    "settings": {
      "name": "My Updated Restaurant",
      "currency": "USD"
    }
  }'
```

### Example: Reorder Categories
```bash
curl -X POST http://localhost:3000/api/owner/categories/reorder \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "RESTAURANT_ID",
    "categories": [
      {"id": "CAT_1_ID", "order": 0},
      {"id": "CAT_2_ID", "order": 1}
    ]
  }'
```

---

## 🔍 Error Responses

### Common Error Codes

#### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [...]
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "error": "Restaurant not found or unauthorized"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 📝 Notes

### Date Formats
- All dates are in ISO 8601 format: `2025-01-12T12:00:00.000Z`
- Timezone conversions handled by server based on restaurant settings

### Currency
- All prices stored in cents (e.g., $5.99 = 599 cents)
- Currency symbol determined by `settings.currency`

### File Uploads
- Use `multipart/form-data` for file uploads
- Upload endpoint: `POST /api/upload`
- Returns: `{ url: "https://cloudinary.com/..." }`

### Real-time Updates
- WebSocket events emitted on order status changes
- Socket rooms: `restaurant:<restaurantId>`
- Events: `new-order`, `order-status-updated`

---

## 🚀 Quick Start Testing Flow

1. **Create Account**
   ```
   POST /api/auth/signup
   ```

2. **Login**
   ```
   POST /api/auth/login
   → Get token
   ```

3. **Create Restaurant**
   ```
   POST /api/owner/restaurant
   ```

4. **Update Settings**
   ```
   PATCH /api/owner/restaurant/settings
   ```

5. **Create Category**
   ```
   POST /api/owner/categories
   ```

6. **Create Menu Item**
   ```
   POST /api/owner/menu-items
   ```

7. **Get QR Code URL**
   ```
   https://yourdomain.com/menu/<restaurant-slug>
   ```

8. **Create Test Order** (as customer)
   ```
   POST /api/orders/create
   ```

9. **Get Orders** (as owner)
   ```
   GET /api/owner/orders?restaurantId=<id>
   ```

10. **Update Order Status**
    ```
    PATCH /api/owner/orders/<id>/status
    ```

Done! 🎉
