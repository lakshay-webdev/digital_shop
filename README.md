# 🛍️ DigiSho — Full-Stack Multi-Vendor eCommerce Platform

> Amazon + Flipkart level eCommerce platform with separate Customer Website and Admin Dashboard, built with Next.js, Node.js, Express, and MongoDB.


## 🗂️ Project Structure

```
digisho/
├── backend/                    # Node.js + Express REST API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT auth + role guards
│   ├── models/
│   │   ├── User.js             # User model (OTP, JWT, addresses)
│   │   ├── Product.js          # Product model (variants, reviews, SEO)
│   │   ├── Order.js            # Order model (status history, tracking)
│   │   └── misc.js             # Category, Coupon, Banner models
│   ├── routes/
│   │   ├── auth.js             # Register, login, OTP, forgot password
│   │   ├── products.js         # CRUD, search, filters, pagination
│   │   ├── orders.js           # Place, track, cancel, return
│   │   ├── users.js            # Profile, addresses, admin user mgmt
│   │   ├── cart.js             # Cart management
│   │   ├── wishlist.js         # Wishlist toggle
│   │   ├── reviews.js          # Product reviews
│   │   ├── coupons.js          # Coupon CRUD + validation
│   │   ├── banners.js          # Banner management
│   │   ├── payments.js         # Razorpay + Stripe integration
│   │   ├── admin.js            # Dashboard analytics + charts
│   │   ├── upload.js           # Cloudinary image upload
│   │   └── notifications.js    # User notifications
│   ├── utils/
│   │   ├── sendEmail.js        # Nodemailer email templates
│   │   ├── sendSMS.js          # Twilio OTP SMS
│   │   └── seed.js             # Database seeder
│   ├── server.js               # Express entry point
│   ├── .env.example            # Environment variables template
│   ├── Dockerfile
│   └── package.json
│
├── frontend-customer/          # Customer Website (Next.js + Tailwind)
│   ├── components/
│   │   ├── Layout.js           # Page layout with Navbar + Footer
│   │   ├── Navbar.js           # Sticky nav, search suggestions, cart
│   │   ├── CartSidebar.js      # Slide-out cart drawer
│   │   └── ProductCard.js      # Reusable product card
│   ├── lib/
│   │   └── api.js              # Axios client + typed API helpers
│   ├── pages/
│   │   ├── index.js            # Homepage (hero, categories, products)
│   │   ├── login.js            # Login / Register / OTP
│   │   ├── checkout.js         # Checkout with Razorpay integration
│   │   ├── products/[slug].js  # Product detail page
│   │   └── orders/index.js     # Order history + tracker
│   ├── store/
│   │   └── index.js            # Zustand stores (auth, cart, wishlist)
│   ├── styles/globals.css
│   ├── Dockerfile
│   └── package.json
│
├── admin-dashboard/            # Admin Panel (Next.js + Tailwind) — PORT 3001
│   ├── components/
│   │   └── AdminLayout.js      # Sidebar layout with auth guard
│   ├── lib/
│   │   └── api.js              # Admin API client
│   ├── pages/
│   │   ├── index.js            # Admin login (/admin-login equivalent)
│   │   ├── dashboard/index.js  # KPI cards + revenue charts
│   │   ├── products/index.js   # Product CRUD management
│   │   ├── orders/index.js     # Order management + status updates
│   │   ├── users/index.js      # User management + block/unblock
│   │   ├── coupons/index.js    # Coupon creation and management
│   │   └── banners/index.js    # Banner management with preview
│   ├── styles/globals.css
│   └── package.json
│
├── docker-compose.yml          # Full-stack Docker setup
├── package.json                # Monorepo scripts
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (image storage)
- Razorpay account (payments)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/digisho.git
cd digisho
npm run install:all
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Fill in your credentials in backend/.env
```

### 3. Create frontend .env files
```bash
# frontend-customer/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# admin-dashboard/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CUSTOMER_URL=http://localhost:3000
```

### 4. Seed Database
```bash
npm run seed
# Creates: admin user, sample products, categories, coupons, banners
```

### 5. Run in Development
```bash
npm run dev
# Backend  → http://localhost:5000
# Customer → http://localhost:3000
# Admin    → http://localhost:3001
```

---

## 🐳 Docker Deployment

```bash
# Copy and fill .env for Docker
cp backend/.env.example .env

# Build and run all services
docker-compose up --build -d

# Seed production database
docker exec digisho-api node utils/seed.js
```

---

## 🔐 Admin Panel

The Admin Panel runs on a **completely separate port (3001)** and has no connection to the customer website URL.

| URL                          | Access           |
|------------------------------|------------------|
| `http://localhost:3001`       | Admin Login Page |
| `http://localhost:3001/dashboard` | Dashboard   |
| `http://localhost:3001/products`  | Products    |
| `http://localhost:3001/orders`    | Orders      |
| `http://localhost:3001/users`     | Users       |
| `http://localhost:3001/coupons`   | Coupons     |
| `http://localhost:3001/banners`   | Banners     |

**Default Admin Credentials** (change immediately after setup):
- Email: `admin@digisho.com`
- Password: `Admin@Secure123`

---

## 🛒 Customer Website Pages

| Route                    | Description                        |
|--------------------------|------------------------------------|
| `/`                      | Homepage (hero, deals, products)   |
| `/login`                 | Login / Register / OTP             |
| `/products`              | Product listing with filters       |
| `/products/[slug]`       | Product detail + reviews           |
| `/checkout`              | Checkout + Razorpay payment        |
| `/orders`                | Order history + live tracking      |
| `/orders/[id]`           | Single order detail                |
| `/profile`               | User profile + addresses           |
| `/wishlist`              | Saved products                     |
| `/forgot-password`       | Password reset flow                |

---

## 📡 API Reference

### Auth
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | `/api/auth/register`        | Create account       |
| POST   | `/api/auth/login`           | Email + password     |
| POST   | `/api/auth/send-otp`        | Send OTP via SMS     |
| POST   | `/api/auth/verify-otp`      | Verify OTP           |
| POST   | `/api/auth/forgot-password` | Send reset email     |
| PUT    | `/api/auth/reset-password/:token` | Reset password |
| GET    | `/api/auth/me`              | Get current user     |

### Products
| Method | Endpoint                    | Description             |
|--------|-----------------------------|-------------------------|
| GET    | `/api/products`             | List with filters/search|
| GET    | `/api/products/featured`    | Featured products       |
| GET    | `/api/products/search?q=`   | Search suggestions      |
| GET    | `/api/products/:slug`       | Single product          |
| POST   | `/api/products`             | Create (admin)          |
| PUT    | `/api/products/:id`         | Update (admin)          |
| DELETE | `/api/products/:id`         | Soft delete (admin)     |
| POST   | `/api/products/:id/reviews` | Add review (user)       |

### Orders
| Method | Endpoint                    | Description             |
|--------|-----------------------------|-------------------------|
| POST   | `/api/orders`               | Place order             |
| GET    | `/api/orders/my`            | Customer's orders       |
| GET    | `/api/orders/:id`           | Order detail            |
| PUT    | `/api/orders/:id/cancel`    | Cancel order            |
| PUT    | `/api/orders/:id/return`    | Request return          |
| GET    | `/api/orders`               | All orders (admin)      |
| PUT    | `/api/orders/:id/status`    | Update status (admin)   |

### Payments
| Method | Endpoint                            | Description           |
|--------|-------------------------------------|-----------------------|
| POST   | `/api/payments/razorpay/create-order` | Create Razorpay order |
| POST   | `/api/payments/razorpay/verify`     | Verify payment        |
| POST   | `/api/payments/stripe/create-intent`| Stripe payment intent |

### Admin Analytics
| Method | Endpoint                          | Description       |
|--------|-----------------------------------|-------------------|
| GET    | `/api/admin/stats`                | Dashboard KPIs    |
| GET    | `/api/admin/revenue-chart`        | Revenue over time |
| GET    | `/api/admin/top-products`         | Best sellers      |
| GET    | `/api/admin/recent-orders`        | Latest orders     |
| GET    | `/api/admin/order-status-breakdown`| Status pie chart  |

---

## 🛠️ Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Frontend      | Next.js 14, Tailwind CSS, Zustand       |
| Admin         | Next.js 14, Tailwind CSS, Recharts      |
| Backend       | Node.js, Express.js                     |
| Database      | MongoDB + Mongoose                      |
| Auth          | JWT + bcryptjs + OTP (Twilio)           |
| Payments      | Razorpay + Stripe                       |
| Images        | Cloudinary                              |
| Email         | Nodemailer (SMTP)                       |
| State         | Zustand + React Query                   |
| Deployment    | Docker + Docker Compose                 |

---

## 🔒 Security

- JWT tokens stored in HTTP-only cookies + localStorage
- Passwords hashed with bcryptjs (12 salt rounds)
- Rate limiting on all API routes (stricter on auth)
- Helmet.js security headers
- Admin panel on separate port — never accessible from customer URL
- Role-based authorization (`customer` / `admin` / `superadmin`)
- Input validation with express-validator (extend as needed)
- CORS locked to specific origins

---

## 📦 Features Checklist

### ✅ Customer Website
- [x] Premium homepage with hero banners
- [x] Flash sale timer
- [x] Category grid
- [x] Product listing with search, filters, pagination
- [x] Product detail with image gallery, variants, reviews
- [x] Add to cart / Buy now / Wishlist
- [x] User registration + login + OTP
- [x] Checkout with address management
- [x] Payment: COD / UPI / Card / Razorpay / Stripe
- [x] Coupon code system
- [x] Order history with live tracking
- [x] Cancel / Return / Refund request
- [x] Email notifications
- [x] Fully responsive (mobile + tablet + desktop)

### ✅ Admin Dashboard
- [x] Secure login (separate port, separate URL)
- [x] KPI dashboard (revenue, orders, users, pending)
- [x] Revenue charts (Recharts area + bar)
- [x] Order status breakdown (pie chart)
- [x] Product CRUD (add, edit, delete, toggle featured)
- [x] Bulk image upload (Cloudinary)
- [x] Order management with expandable rows
- [x] Order status updates (8 stages)
- [x] Tracking number assignment
- [x] User management (block/unblock)
- [x] Coupon creator (% / flat, expiry, limits)
- [x] Banner management with live preview

---

## 📝 License

MIT — Built with ❤️ for DigiSho
