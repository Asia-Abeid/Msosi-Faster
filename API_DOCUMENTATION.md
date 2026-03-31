# Msosi Faster - API Documentation

Complete API reference for Msosi Faster food delivery backend.

## Base URL
- Development: `http://localhost:8000/api`
- Production: `https://msosi-faster.railway.app/api`

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

---

## 1. USER ENDPOINTS

### Register User
**POST** `/users/register/`

Request:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123",
  "phone_number": "255712345678",
  "is_customer": true,
  "is_restaurant_owner": false
}
```

Response (201 Created):
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "phone_number": "255712345678",
  "is_customer": true,
  "is_restaurant_owner": false
}
```

### Login
**POST** `/users/login/`

Request:
```json
{
  "username": "john_doe",
  "password": "securepass123"
}
```

Response (200 OK):
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "255712345678",
    "is_customer": true,
    "is_restaurant_owner": false,
    "address": null,
    "profile_picture": null
  }
}
```

### Refresh Token
**POST** `/users/token/refresh/`

Request:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Response (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Get User Profile
**GET** `/users/profile/`

Headers:
```
Authorization: Bearer <access_token>
```

Response (200 OK):
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "phone_number": "255712345678",
  "is_customer": true,
  "is_restaurant_owner": false,
  "address": "123 Main St, Dar es Salaam",
  "profile_picture": "/media/profiles/john_doe.jpg"
}
```

### Update User Profile
**PUT** `/users/profile/`

Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request:
```json
{
  "email": "newemail@example.com",
  "phone_number": "255712345679",
  "address": "456 Oak Ave, Dar es Salaam"
}
```

Response (200 OK):
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "newemail@example.com",
  "phone_number": "255712345679",
  "address": "456 Oak Ave, Dar es Salaam",
  "profile_picture": "/media/profiles/john_doe.jpg"
}
```

---

## 2. RESTAURANT ENDPOINTS

### List Restaurants
**GET** `/restaurants/`

Parameters:
- `page`: Page number (default: 1)
- `search`: Search by name
- `ordering`: Sort by field

Response (200 OK):
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/restaurants/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "owner": 2,
      "name": "Pizza Palace",
      "description": "Best pizza in town",
      "address": "Oysterbay, Dar es Salaam",
      "phone_number": "255712345678",
      "image": "/media/restaurants/pizza_palace.jpg",
      "is_active": true,
      "created_at": "2024-03-15T10:30:00Z",
      "menu_items": []
    }
  ]
}
```

### Create Restaurant (Auth Required)
**POST** `/restaurants/`

Headers:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Request:
```
- name: Pizza Palace
- description: Best pizza in town
- address: Oysterbay, Dar es Salaam
- phone_number: 255712345678
- image: <file>
```

Response (201 Created):
```json
{
  "id": 1,
  "owner": 2,
  "name": "Pizza Palace",
  "description": "Best pizza in town",
  "address": "Oysterbay, Dar es Salaam",
  "phone_number": "255712345678",
  "image": "/media/restaurants/pizza_palace.jpg",
  "is_active": true,
  "created_at": "2024-03-15T10:30:00Z",
  "menu_items": []
}
```

### Get Restaurant Detail
**GET** `/restaurants/{id}/`

Response (200 OK):
```json
{
  "id": 1,
  "owner": 2,
  "name": "Pizza Palace",
  "description": "Best pizza in town",
  "address": "Oysterbay, Dar es Salaam",
  "phone_number": "255712345678",
  "image": "/media/restaurants/pizza_palace.jpg",
  "is_active": true,
  "created_at": "2024-03-15T10:30:00Z",
  "menu_items": []
}
```

### List Menu Items
**GET** `/restaurants/{restaurant_id}/menu/`

Response (200 OK):
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "name": "Margherita Pizza",
      "description": "Fresh mozzarella and basil",
      "price": "25000.00",
      "image": "/media/menu_items/margherita.jpg",
      "is_available": true,
      "created_at": "2024-03-15T10:35:00Z"
    }
  ]
}
```

### Create Menu Item (Auth Required)
**POST** `/restaurants/{restaurant_id}/menu/`

Headers:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Request:
```
- name: Margherita Pizza
- description: Fresh mozzarella and basil
- price: 25000.00
- image: <file>
```

Response (201 Created):
```json
{
  "id": 1,
  "name": "Margherita Pizza",
  "description": "Fresh mozzarella and basil",
  "price": "25000.00",
  "image": "/media/menu_items/margherita.jpg",
  "is_available": true,
  "created_at": "2024-03-15T10:35:00Z"
}
```

---

## 3. ORDER ENDPOINTS

### List Orders (Auth Required)
**GET** `/orders/`

Headers:
```
Authorization: Bearer <access_token>
```

Parameters:
- `page`: Page number
- `ordering`: -created_at (latest first)

Response (200 OK):
```json
{
  "count": 5,
  "results": [
    {
      "id": 101,
      "customer": 1,
      "status": "delivered",
      "delivery_address": "123 Main St",
      "total_price": "75000.00",
      "created_at": "2024-03-15T11:00:00Z",
      "updated_at": "2024-03-15T12:30:00Z",
      "items": [
        {
          "id": 1,
          "menu_item": 1,
          "quantity": 2,
          "price": "37500.00"
        }
      ]
    }
  ]
}
```

### Create Order (Auth Required)
**POST** `/orders/`

Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request:
```json
{
  "delivery_address": "123 Main St, Dar es Salaam",
  "total_price": "75000.00"
}
```

Response (201 Created):
```json
{
  "id": 101,
  "customer": 1,
  "status": "pending",
  "delivery_address": "123 Main St, Dar es Salaam",
  "total_price": "75000.00",
  "created_at": "2024-03-15T11:00:00Z",
  "updated_at": "2024-03-15T11:00:00Z",
  "items": []
}
```

### Get Order Detail (Auth Required)
**GET** `/orders/{id}/`

Response (200 OK):
```json
{
  "id": 101,
  "customer": 1,
  "status": "pending",
  "delivery_address": "123 Main St",
  "total_price": "75000.00",
  "created_at": "2024-03-15T11:00:00Z",
  "updated_at": "2024-03-15T11:00:00Z",
  "items": [
    {
      "id": 1,
      "menu_item": 1,
      "quantity": 2,
      "price": "37500.00"
    }
  ]
}
```

### Add Order Items (Auth Required)
**POST** `/orders/{order_id}/items/`

Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request:
```json
{
  "menu_item": 1,
  "quantity": 2,
  "price": "37500.00"
}
```

Response (201 Created):
```json
{
  "id": 1,
  "menu_item": 1,
  "quantity": 2,
  "price": "37500.00"
}
```

### Update Order (Auth Required)
**PUT** `/orders/{id}/`

Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request:
```json
{
  "status": "confirmed",
  "delivery_address": "456 Oak Ave"
}
```

Response (200 OK):
```json
{
  "id": 101,
  "customer": 1,
  "status": "confirmed",
  "delivery_address": "456 Oak Ave",
  "total_price": "75000.00"
}
```

---

## 4. PAYMENT ENDPOINTS

### List Payments (Auth Required)
**GET** `/payments/`

Headers:
```
Authorization: Bearer <access_token>
```

Response (200 OK):
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "order": 101,
      "customer": 1,
      "amount": "75000.00",
      "payment_method": "mpesa",
      "status": "completed",
      "transaction_id": "STN123456789",
      "created_at": "2024-03-15T11:05:00Z",
      "updated_at": "2024-03-15T11:06:00Z"
    }
  ]
}
```

### Create Payment (Auth Required)
**POST** `/payments/{order_id}/pay/`

Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request:
```json
{
  "payment_method": "mpesa"
}
```

Response (201 Created):
```json
{
  "id": 1,
  "order": 101,
  "customer": 1,
  "amount": "75000.00",
  "payment_method": "mpesa",
  "status": "pending",
  "transaction_id": null,
  "created_at": "2024-03-15T11:05:00Z",
  "updated_at": "2024-03-15T11:05:00Z"
}
```

### Get Payment Detail (Auth Required)
**GET** `/payments/{id}/`

Response (200 OK):
```json
{
  "id": 1,
  "order": 101,
  "customer": 1,
  "amount": "75000.00",
  "payment_method": "mpesa",
  "status": "completed",
  "transaction_id": "STN123456789",
  "created_at": "2024-03-15T11:05:00Z",
  "updated_at": "2024-03-15T11:06:00Z"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Successful deletion |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal server error |

---

## Order Status Values

- `pending` - Order placed, awaiting confirmation
- `confirmed` - Restaurant confirmed the order
- `preparing` - Restaurant is preparing food
- `on_the_way` - Order is being delivered
- `delivered` - Order delivered
- `cancelled` - Order cancelled

---

## Payment Statuses

- `pending` - Payment awaiting processing
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

---

## Payment Methods

- `mpesa` - M-Pesa mobile money
- `tigo_pesa` - Tigo Pesa mobile money
- `airtel_money` - Airtel Money mobile money
- `card` - Credit/Debit card via Stripe

---

## Error Response Format

```json
{
  "error": "Error message here",
  "details": {
    "field_name": ["Error detail 1", "Error detail 2"]
  }
}
```

Example:
```json
{
  "error": "Validation failed",
  "details": {
    "phone_number": ["This field may not be blank."],
    "password": ["Password must be at least 8 characters."]
  }
}
```

---

## Rate Limiting

- Payment endpoints: 10 requests per minute
- Login endpoint: 5 requests per minute
- Other endpoints: 100 requests per minute

---

## Pagination

List endpoints support pagination with 20 items per page:

Response includes:
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

Navigate using `?page=2`, `?page=3`, etc.

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "phone_number": "255712345678",
    "is_customer": true
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

### Protected Request
```bash
curl http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Support

For API issues or questions, contact the development team or create an issue in the GitHub repository.
