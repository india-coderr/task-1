# Foodly Kitchen - Restaurant POS System

A full-stack Restaurant Point of Sale (POS) and Kitchen Order Management system built for daily restaurant and cafe operations.

---

## 1. Live Deployment URL

- **Frontend URL (Vercel)**: https://client-1-sandy.vercel.app/

### How to Deploy to Vercel (Frontend)
1. Open terminal inside the `client` folder:
   ```bash
   cd client
   vercel
   ```
2. Follow the prompt to log in and select your project.
3. In your Vercel Project Settings > Environment Variables, add:
   - `NEXT_PUBLIC_API_URL` = your live backend API URL (e.g. `https://your-backend.onrender.com/api`)
4. Redeploy to apply the environment variable.

---

## 2. Project Overview

Foodly Kitchen is a web-based POS application designed for local restaurants, cafes, and diners. It connects front-of-house order taking with back-of-house kitchen ticket management.

- **Cashiers / Staff** can create dine-in and takeaway orders, browse the food catalog, apply discounts, collect payments (Cash / UPI), and print order tickets.
- **Kitchen Staff** can see orders move live through kitchen stages: Pending -> Preparing -> Ready -> Completed.
- **Managers / Admins** can update dishes, change prices, toggle out-of-stock items, adjust GST tax rates, set staff discount caps, and inspect daily sales summaries.

---

## 3. Features

### Ordering & POS
- **Fast Menu Catalog**: Search food items by name, filter by category (Burgers, Pizzas, Pastas, Beverages, Desserts).
- **Service Type Toggle**: Easily switch between Dine-In (with table number) and Takeaway.
- **Live Cart**: Real-time quantity adjustments, cart item deletion, and notes.
- **Server-Side Billing Calculation**: The server automatically recalculates subtotals, tax rate, and discounts. The client cannot manipulate total amounts.
- **Discounts**: Apply Percentage (`%`) or Fixed (`₹`) discounts. Staff discounts are capped by the system limit.
- **Atomic Order Numbers**: Formatted sequentially as `ORD-YYYYMMDD-0001` using atomic counters.

### Kitchen & Ticket Tracking
- **Order State Progression**: Orders move forward step-by-step: `Pending` -> `Preparing` -> `Ready` -> `Completed`.
- **Item Lock**: Order items can only be edited while the ticket is `Pending` and `Unpaid`. Once cooking starts, items are locked.
- **Payment Settlement**: Record payments via Cash or UPI. Exact amount must match the order total.
- **Completion Guard**: An order cannot be marked `Completed` until payment is recorded (`Paid`).
- **Printable Receipts**: Clean, print-friendly ticket modal for guest checks and kitchen receipts.

### Menu Management (Admin Only)
- View complete dish catalog with prices, categories, and stock status.
- Add new dishes with name, price, category, description, and image URL.
- Edit existing dishes and prices.
- Toggle item stock availability on and off with one click.
- Soft-deactivate items instead of hard deleting, preserving past order history.

### Daily Sales Reports & Analytics
- Live dashboard displaying Gross Daily Revenue, Total Orders, In-Progress count, and Completed orders.
- Payment method breakdown: Total Cash sales and count vs. Total UPI sales and count.
- Date filter picker to review past sales days.
- Recent orders table with direct link to view full order details.

### Restaurant Settings (Admin Only)
- Restaurant legal / brand name.
- Tax Rate / GST percentage (default 5%).
- Currency symbol (default ₹).
- Maximum staff discount limit percentage (default 15%).

---

## 4. Demo Login Credentials

The application comes pre-seeded with two accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@pos.com` | `Admin@123` | Full access to Menu CRUD, Settings, Orders, and Sales Reports |
| **Staff** | `staff@pos.com` | `Staff@123` | Can take orders, update kitchen status, take payments, and view daily sales (discounts capped at 15%) |

*(Quick-login buttons on the login page allow 1-click credential filling).*

---

## 5. Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion (`motion/react`).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose ODM (supports MongoDB Atlas or local MongoDB).
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing.
- **Validation**: Zod schema validation for all API inputs.
- **Architecture**: RESTful API with centralized error handling and non-blocking database reconnection.

---

## 6. Environment Variables

### Server (`server/.env`)
Create a file named `.env` inside the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://unique7174_db_user:pTbTLch5ikifV2Jt@cluster0.o5kd6na.mongodb.net/restaurant_pos?retryWrites=true&w=majority
JWT_SECRET=super_secret_foodly_pos_jwt_token_key_2026
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
```

- `PORT`: Port for the backend API server (default `5000`).
- `MONGO_URI`: MongoDB Atlas connection string or local MongoDB URI (`mongodb://127.0.0.1:27017/restaurant_pos`).
- `JWT_SECRET`: Secret key used to sign and verify JSON Web Tokens.
- `JWT_EXPIRES_IN`: Token validity period (e.g. `1d` for 1 day).
- `CLIENT_URL`: URL of the frontend client for CORS configuration.

### Client (`client/.env.local`)
Create a file named `.env.local` inside the `client/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

- `NEXT_PUBLIC_API_URL`: Base URL of the backend API endpoints.

---

## 7. Local Setup Steps

### Prerequisites
- Node.js (version 18 or higher)
- npm (version 9 or higher)
- Internet connection for MongoDB Atlas (or local MongoDB running)

### Step 1: Clone or Navigate to Project
```bash
cd "c:/Users/UNIQU/Desktop/SDE ROLE"
```

### Step 2: Setup and Start Backend Server
```bash
cd server
npm install
npm run seed     # Seeds demo admin, staff, settings, and 16 menu dishes
npm run dev      # Runs backend server on http://localhost:5000
```

### Step 3: Setup and Start Frontend Client
Open a second terminal window:
```bash
cd client
npm install
npm run dev      # Runs frontend on http://localhost:3000
```

### Step 4: Open Application
Open your browser and visit:
```
http://localhost:3000
```

---

## 8. Database Setup & Seed Steps

1. **MongoDB Connection**:
   - The project uses MongoDB Atlas. Ensure `MONGO_URI` is set in `server/.env`.
   - **Important Atlas Tip**: In your MongoDB Atlas Dashboard (`cloud.mongodb.com`), go to **Network Access** and ensure your IP address is added, or choose **Allow Access from Anywhere (`0.0.0.0/0`)** so your connection never gets blocked on network changes.

2. **Seeding the Database**:
   Run the following command from the `server/` folder:
   ```bash
   npm run seed
   ```
   What the seed script does:
   - Creates the **Admin** user (`admin@pos.com` / `Admin@123`).
   - Creates the **Staff** user (`staff@pos.com` / `Staff@123`).
   - Creates default **Settings** (GST: 5%, Currency: ₹, Staff discount cap: 15%).
   - Inserts **16 food and beverage items** across 5 categories with prices and images.
   - Cleans and resets the atomic daily order counter.

---

## 9. Test Commands & Verification

You can verify and test both the client and server locally using the following commands:

- **Check Backend Syntax**:
  ```bash
  node -c server/src/server.js
  ```
- **Test Server Health Endpoint**:
  ```bash
  curl http://localhost:5000/api/health
  ```
- **Test Admin Login via API**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@pos.com\",\"password\":\"Admin@123\"}"
  ```
- **Build Frontend for Production**:
  ```bash
  cd client
  npm run build
  ```
- **Lint Frontend**:
  ```bash
  cd client
  npm run lint
  ```

---

## 10. API Documentation (Tested in Postman)

All API routes start with prefix `/api`.
For protected routes, include header:
`Authorization: Bearer <your_jwt_token>`

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Auth**: Public
- **Description**: Returns server and database status.
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "database": "connected",
      "service": "Foodly Kitchen POS API"
    }
  }
  ```

---

### 2. Authentication

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@pos.com",
    "password": "Admin@123"
  }
  ```
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "6ad29515b83c9f955821dac2",
        "name": "Chef Gordon (Admin)",
        "email": "admin@pos.com",
        "role": "admin"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth**: Authenticated (Staff / Admin)
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "6ad29515b83c9f955821dac2",
        "name": "Chef Gordon (Admin)",
        "email": "admin@pos.com",
        "role": "admin"
      }
    }
  }
  ```

---

### 3. Menu Management

#### Get All Menu Items
- **Endpoint**: `GET /api/menu`
- **Auth**: Authenticated
- **Query Parameters**:
  - `search` (optional): search by name or description (e.g. `?search=burger`)
  - `category` (optional): filter by category (e.g. `?category=Pizzas`)
  - `activeOnly` (optional): `true` / `false`
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "_id": "6ad29515b83c9f955821dad1",
          "name": "Cheesy Smashed Beef Burger",
          "category": "Burgers",
          "price": 8.99,
          "description": "Double smashed beef patty with melted cheddar.",
          "isAvailable": true,
          "isActive": true
        }
      ],
      "categories": ["All", "Beverages", "Burgers", "Desserts", "Pastas", "Pizzas"]
    }
  }
  ```

#### Create Menu Item (Admin Only)
- **Endpoint**: `POST /api/menu`
- **Auth**: Admin
- **Request Body**:
  ```json
  {
    "name": "Crispy French Fries",
    "category": "Burgers",
    "price": 3.99,
    "description": "Golden salted fries with house mayo.",
    "isAvailable": true
  }
  ```
- **Sample Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821dae5",
      "name": "Crispy French Fries",
      "category": "Burgers",
      "price": 3.99,
      "isAvailable": true,
      "isActive": true
    }
  }
  ```

#### Update Menu Item (Admin Only)
- **Endpoint**: `PUT /api/menu/:id`
- **Auth**: Admin
- **Request Body**:
  ```json
  {
    "price": 4.49,
    "isAvailable": false
  }
  ```
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821dae5",
      "name": "Crispy French Fries",
      "price": 4.49,
      "isAvailable": false
    }
  }
  ```

#### Soft-Deactivate Menu Item (Admin Only)
- **Endpoint**: `PATCH /api/menu/:id/deactivate`
- **Auth**: Admin
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821dae5",
      "isActive": false
    }
  }
  ```

---

### 4. Orders & Kitchen POS

#### Create Order
- **Endpoint**: `POST /api/orders`
- **Auth**: Authenticated (Staff / Admin)
- **Request Body**:
  ```json
  {
    "orderType": "dine-in",
    "tableNumber": "4",
    "customerName": "John",
    "items": [
      {
        "menuItemId": "6ad29515b83c9f955821dad1",
        "quantity": 2
      }
    ],
    "discountType": "percentage",
    "discountValue": 10
  }
  ```
- **Sample Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821daff",
      "orderNumber": "ORD-20261017-0008",
      "orderType": "dine-in",
      "tableNumber": "4",
      "customerName": "John",
      "subtotal": 17.98,
      "taxRate": 5,
      "taxAmount": 0.81,
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 1.80,
      "total": 16.99,
      "status": "Pending",
      "paymentStatus": "Unpaid"
    }
  }
  ```

#### List Orders with Filters
- **Endpoint**: `GET /api/orders`
- **Auth**: Authenticated
- **Query Parameters**:
  - `status`: `Pending` | `Preparing` | `Ready` | `Completed`
  - `paymentStatus`: `Unpaid` | `Paid`
  - `date`: `YYYY-MM-DD`
  - `page`: page number (default 1)
  - `limit`: items per page (default 20)
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6ad29515b83c9f955821daff",
        "orderNumber": "ORD-20261017-0008",
        "orderType": "dine-in",
        "tableNumber": "4",
        "total": 16.99,
        "status": "Pending",
        "paymentStatus": "Unpaid"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalCount": 8,
      "totalPages": 1
    }
  }
  ```

#### Get Single Order Details
- **Endpoint**: `GET /api/orders/:id`
- **Auth**: Authenticated
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821daff",
      "orderNumber": "ORD-20261017-0008",
      "items": [
        {
          "menuItemId": "6ad29515b83c9f955821dad1",
          "nameSnapshot": "Cheesy Smashed Beef Burger",
          "priceSnapshot": 8.99,
          "quantity": 2,
          "lineTotal": 17.98
        }
      ],
      "subtotal": 17.98,
      "taxAmount": 0.81,
      "total": 16.99,
      "status": "Pending",
      "paymentStatus": "Unpaid"
    }
  }
  ```

#### Edit Order Items (Allowed only when Pending & Unpaid)
- **Endpoint**: `PUT /api/orders/:id`
- **Auth**: Authenticated
- **Request Body**:
  ```json
  {
    "items": [
      {
        "menuItemId": "6ad29515b83c9f955821dad1",
        "quantity": 3
      }
    ]
  }
  ```
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821daff",
      "orderNumber": "ORD-20261017-0008",
      "total": 25.48,
      "status": "Pending"
    }
  }
  ```

#### Advance Kitchen Status
- **Endpoint**: `PATCH /api/orders/:id/status`
- **Auth**: Authenticated
- **Rules**: Must move forward one step (`Pending` -> `Preparing` -> `Ready` -> `Completed`). To mark `Completed`, payment must be `Paid`.
- **Request Body**:
  ```json
  {
    "status": "Preparing"
  }
  ```
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821daff",
      "status": "Preparing"
    }
  }
  ```

#### Record Payment
- **Endpoint**: `POST /api/orders/:id/payment`
- **Auth**: Authenticated
- **Rules**: Amount must exactly match order total. Duplicate payment rejected.
- **Request Body**:
  ```json
  {
    "method": "Cash",
    "amount": 16.99
  }
  ```
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ad29515b83c9f955821daff",
      "paymentStatus": "Paid",
      "payment": {
        "method": "Cash",
        "amount": 16.99,
        "paidAt": "2026-10-17T07:55:00.000Z"
      }
    }
  }
  ```

---

### 5. Sales Reports

#### Get Daily Sales Summary
- **Endpoint**: `GET /api/reports/daily-sales`
- **Auth**: Authenticated
- **Query Parameters**:
  - `date` (optional): `YYYY-MM-DD` (defaults to today)
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-10-17",
      "currency": "₹",
      "metrics": {
        "totalOrders": 8,
        "completedOrders": 6,
        "inProgressOrders": 2,
        "pendingOrders": 1,
        "preparingOrders": 1,
        "readyOrders": 0,
        "totalSales": 152.53,
        "paymentSplit": {
          "cash": { "total": 143.10, "count": 6 },
          "upi": { "total": 9.43, "count": 1 }
        }
      },
      "recentOrders": [ ... ]
    }
  }
  ```

---

### 6. Settings

#### Get Restaurant Settings
- **Endpoint**: `GET /api/settings`
- **Auth**: Authenticated
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "restaurantName": "Foodly Kitchen",
      "taxRate": 5,
      "currency": "₹",
      "staffDiscountLimit": 15
    }
  }
  ```

#### Update Restaurant Settings (Admin Only)
- **Endpoint**: `PUT /api/settings`
- **Auth**: Admin
- **Request Body**:
  ```json
  {
    "restaurantName": "Foodly Kitchen Bistro",
    "taxRate": 5,
    "currency": "₹",
    "staffDiscountLimit": 20
  }
  ```
- **Sample Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "restaurantName": "Foodly Kitchen Bistro",
      "taxRate": 5,
      "currency": "₹",
      "staffDiscountLimit": 20
    }
  }
  ```
