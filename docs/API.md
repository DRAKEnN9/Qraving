# QR Menu Manager API Documentation

Base URL: `http://localhost:3000` (development) or `https://your-domain.com` (production)

## Authentication

Most endpoints require authentication via JWT Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All responses follow this general structure:

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [ ... ] // Optional validation details
}
```

## Authentication Endpoints

### POST /api/auth/signup
Create a new owner account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "owner"
  },
  "token": "jwt_token_here"
}
```

---

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "owner"
  },
  "token": "jwt_token_here"
}
```

---

### GET /api/auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "owner",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Restaurant Management (Owner)

### GET /api/owner/restaurant
List all restaurants owned by the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "restaurants": [
    {
      "_id": "restaurant_id",
      "name": "My Restaurant",
      "slug": "my-restaurant",
      "address": "123 Main St",
      "tableNumber": 20,
      "logoUrl": "https://...",
      "qrCodeUrl": "data:image/png;base64,...",
      "settings": {
        "currency": "USD",
        "timezone": "America/New_York",
        "enableNotifications": true
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/owner/restaurant
Create a new restaurant.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Restaurant",
  "address": "123 Main Street, City, State",
  "tableNumber": 20,
  "slug": "my-restaurant",
  "logoUrl": "https://example.com/logo.png"
}
```

**Response:** `201 Created`
```json
{
  "message": "Restaurant created successfully",
  "restaurant": {
    "_id": "restaurant_id",
    "name": "My Restaurant",
    "slug": "my-restaurant",
    "qrCodeUrl": "data:image/png;base64,...",
    ...
  }
}
```

---

### PATCH /api/owner/restaurant/:id
Update restaurant details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "tableNumber": 25,
  "settings": {
    "enableNotifications": false
  }
}
```

**Response:** `200 OK`

---

### DELETE /api/owner/restaurant/:id
Delete a restaurant.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Category Management (Owner)

### GET /api/owner/categories
Get categories for a restaurant.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `restaurantId` (required): Restaurant ID

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "_id": "category_id",
      "restaurantId": "restaurant_id",
      "name": "Appetizers",
      "order": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/owner/categories
Create a new category.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "restaurantId": "restaurant_id",
  "name": "Appetizers",
  "order": 0
}
```

**Response:** `201 Created`

---

### PATCH /api/owner/categories/:id
Update category.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Category Name",
  "order": 1
}
```

**Response:** `200 OK`

---

### DELETE /api/owner/categories/:id
Delete a category (only if it has no menu items).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Menu Items Management (Owner)

### GET /api/owner/menu-items
Get menu items for a restaurant.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `restaurantId` (required): Restaurant ID
- `categoryId` (optional): Filter by category

**Response:** `200 OK`
```json
{
  "menuItems": [
    {
      "_id": "item_id",
      "restaurantId": "restaurant_id",
      "categoryId": "category_id",
      "name": "Classic Burger",
      "description": "Delicious burger with cheese",
      "priceCents": 1500,
      "images": ["https://..."],
      "orderable": true,
      "soldOut": false,
      "modifiers": [
        {
          "name": "Add Bacon",
          "priceDelta": 300
        }
      ],
      "order": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/owner/menu-items
Create a new menu item.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "restaurantId": "restaurant_id",
  "categoryId": "category_id",
  "name": "Classic Burger",
  "description": "Delicious burger with cheese",
  "priceCents": 1500,
  "images": ["https://example.com/burger.jpg"],
  "orderable": true,
  "soldOut": false,
  "modifiers": [
    {
      "name": "Add Bacon",
      "priceDelta": 300
    }
  ]
}
```

**Response:** `201 Created`

---

### PATCH /api/owner/menu-items/:id
Update menu item.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "priceCents": 1600,
  "soldOut": true
}
```

**Response:** `200 OK`

---

### DELETE /api/owner/menu-items/:id
Delete a menu item.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Orders Management (Owner)

### GET /api/owner/orders
Get orders for a restaurant.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `restaurantId` (required): Restaurant ID
- `status` (optional): Filter by status (received, preparing, ready, completed, cancelled, all)
- `limit` (optional, default: 50): Number of orders to return
- `skip` (optional, default: 0): Number of orders to skip (pagination)

**Response:** `200 OK`
```json
{
  "orders": [
    {
      "_id": "order_id",
      "restaurantId": "restaurant_id",
      "items": [
        {
          "menuItemId": "item_id",
          "name": "Classic Burger",
          "priceCents": 1500,
          "quantity": 2,
          "modifiers": ["Add Bacon"]
        }
      ],
      "totalCents": 3000,
      "currency": "USD",
      "customerName": "Jane Doe",
      "tableNumber": 5,
      "customerEmail": "jane@example.com",
      "paymentStatus": "succeeded",
      "status": "preparing",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "skip": 0,
    "hasMore": true
  }
}
```

---

### PATCH /api/owner/orders/:id/status
Update order status.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Valid status values:** `received`, `preparing`, `ready`, `completed`, `cancelled`

**Response:** `200 OK`
```json
{
  "message": "Order status updated successfully",
  "order": { ... }
}
```

> **Note:** Updating order status automatically sends an email notification to the customer.

---

## Analytics (Owner)

### GET /api/owner/analytics
Get analytics data for a restaurant.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `restaurantId` (required): Restaurant ID
- `days` (optional, default: 30): Number of days to analyze

**Response:** `200 OK`
```json
{
  "period": {
    "days": 30,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T00:00:00.000Z"
  },
  "metrics": {
    "totalOrders": 150,
    "totalRevenue": 450000,
    "averageOrderValue": 3000,
    "ordersByStatus": {
      "completed": 120,
      "preparing": 15,
      "ready": 10,
      "received": 5
    }
  },
  "topItems": [
    {
      "name": "Classic Burger",
      "count": 200,
      "revenue": 300000
    }
  ],
  "dailyRevenue": [
    {
      "date": "2024-01-01",
      "revenue": 15000
    }
  ],
  "peakHours": null
}
```

> **Note:** `peakHours` is only available for Pro tier subscribers.

---

## Customer-Facing Endpoints (Public)

### GET /api/restaurant/:slug/menu
Get public menu for a restaurant (no authentication required).

**Path Parameters:**
- `slug`: Restaurant slug (e.g., "my-restaurant")

**Response:** `200 OK`
```json
{
  "restaurant": {
    "id": "restaurant_id",
    "name": "My Restaurant",
    "logoUrl": "https://...",
    "tableNumber": 20,
    "settings": {
      "currency": "USD"
    }
  },
  "categories": [
    {
      "_id": "category_id",
      "name": "Appetizers",
      "order": 0,
      "items": [
        {
          "_id": "item_id",
          "name": "Caesar Salad",
          "description": "Fresh romaine lettuce...",
          "priceCents": 1200,
          "images": ["https://..."],
          "modifiers": [...]
        }
      ]
    }
  ]
}
```

---

### POST /api/restaurant/:slug/checkout
Create a Stripe checkout session for an order.

**Path Parameters:**
- `slug`: Restaurant slug

**Request Body:**
```json
{
  "restaurantId": "restaurant_id",
  "customerName": "Jane Doe",
  "tableNumber": 5,
  "customerEmail": "jane@example.com",
  "items": [
    {
      "menuItemId": "item_id",
      "name": "Classic Burger",
      "priceCents": 1500,
      "quantity": 2,
      "modifiers": ["Add Bacon"],
      "specialRequest": "No onions"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

> **Note:** Redirect the customer to the `url` to complete payment. Order is only created after successful payment confirmation via webhook.

---

## Webhooks

### POST /api/webhooks/stripe
Stripe webhook handler for payment events.

**Headers:**
- `stripe-signature`: Stripe signature for webhook verification

**Supported Events:**
- `checkout.session.completed`: Creates order after successful payment
- `payment_intent.succeeded`: Updates payment status
- `payment_intent.payment_failed`: Updates payment status to failed

**Response:** `200 OK`
```json
{
  "received": true
}
```

> **Important:** Configure this endpoint in your Stripe Dashboard under Webhooks. All webhook events are logged in the database with signature verification status.

---

## Image Upload

### POST /api/upload
Upload an image to Cloudinary.

**Headers:** `Authorization: Bearer <token>`

**Request:** `multipart/form-data`
- `file`: Image file (JPEG, PNG, WebP, GIF; max 5MB)

**Response:** `200 OK`
```json
{
  "message": "File uploaded successfully",
  "url": "https://res.cloudinary.com/...",
  "publicId": "qr-menu/uploads/..."
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error or invalid input |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Owner endpoints: 100 requests per minute
- Public endpoints: 200 requests per minute

---

## Best Practices

1. **Always validate input** on the client side before sending requests
2. **Store JWT tokens securely** (use httpOnly cookies in production)
3. **Handle errors gracefully** and display user-friendly messages
4. **Use pagination** when fetching large lists of orders
5. **Cache public menu data** to reduce server load
6. **Verify webhook signatures** in production
7. **Use HTTPS** in production

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/yourusername/qr-menu-manager/issues
- Email: support@qrmenumanager.com
