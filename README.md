# Plus Pro - Mobile-First Order & Earnings Tracking Platform

Plus Pro is a professional, highly optimized, and responsive full-stack platform designed specifically for mobile agents to manage orders and track earnings dynamically. It features role-based access control, secure authentication, and a secret admin console.

---

## 🚀 Key Features

*   **Mobile-First Design**: Fully fluid and optimized layout for iOS and Android screens, centered cards, and crisp typography.
*   **Dual Mode Support**: Standard light theme and a polished toggleable dark mode.
*   **Bottom Navigation**: Implemented with fluid motion-driven animations for easy single-thumb navigation.
*   **Dynamic Order Popup**: Modular, validated dynamic form allowing agents to register customer orders with an unlimited number of products and quantities.
*   **Automatic Earnings Calculator**: Every order transitioned to the `Completed` status automatically triggers a secure, server-side `Rs. 100` increase in the user's earnings and available balance.
*   **Real-Time Simulating Notifications**: Instant user feed notifications for status transitions (e.g. `Pending -> Delivery -> Completed`) and disbursements.
*   **Hidden Admin Panel**: Completely isolated operations panel with zero exposed links, protected by server-side role-based checks.

---

## 👤 Seeding & Access Credentials

The database comes fully seeded with functional, interactive accounts:

### 1. Standard Dispatcher Agent Account
*   **Email**: `ali@pluspro.com`
*   **Password**: `user123`
*   **Gateway**: EasyPaisa (`03123456789`)

### 2. 🔑 Secret Admin Operations Account
*   **Email**: `admin@pluspro.com`
*   **Password**: `admin123`
*   **Gateway**: JazzCash (`03001234567`)

> **How to Access the Hidden Admin Panel:**
> 1. Log out of any active session to view the login screen.
> 2. Click the branding text **"Plus Pro"** at the top of the login box **5 times** in quick succession.
> 3. This triggers a secure transition to **"Operations mode"**.
> 4. Input the Admin credentials (`admin@pluspro.com` / `admin123`) and click **Authenticate Portal**.

---

## 📂 Database Architecture (Normalized Models)

Below is the normalized relational SQL diagram equivalent for deployment on relational engines (such as PostgreSQL with Prisma):

### `Users` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | `PRIMARY KEY` | Unique User UUID |
| `fullName` | `VARCHAR` | `NOT NULL` | Agent Full Name |
| `phone` | `VARCHAR` | `NOT NULL` | Primary Contact Number |
| `email` | `VARCHAR` | `UNIQUE, NOT NULL` | Login Identifier |
| `passwordHash` | `VARCHAR` | `NOT NULL` | Bcrypt Encrypted Password |
| `paymentMethod` | `VARCHAR` | `NOT NULL` | `JazzCash` \| `EasyPaisa` |
| `paymentAccount`| `VARCHAR` | `NOT NULL` | Mobile Payout Account Number |
| `role` | `VARCHAR` | `DEFAULT 'user'` | `user` \| `admin` |
| `totalEarnings` | `INT` | `DEFAULT 0` | Secure Backend Earnings tally |
| `availableBalance`| `INT` | `DEFAULT 0` | Balance available for Cash-out |
| `createdAt` | `TIMESTAMP`| `DEFAULT NOW()` | Registration datetime |

### `Orders` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | `PRIMARY KEY` | Unique Order UUID |
| `customerName` | `VARCHAR` | `NOT NULL` | Name of Customer |
| `userId` | `VARCHAR` | `REFERENCES Users(id)`| Creating dispatcher ID |
| `status` | `VARCHAR` | `DEFAULT 'Pending'` | `Pending` \| `Delivery` \| `Completed` |
| `earningAdded` | `BOOLEAN` | `DEFAULT FALSE` | Idempotency guard to prevent double-payouts |
| `createdAt` | `TIMESTAMP`| `DEFAULT NOW()` | Placement datetime |

### `OrderItems` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | `PRIMARY KEY` | Unique Line Item UUID |
| `orderId` | `VARCHAR` | `REFERENCES Orders(id)`| Parent Order link |
| `name` | `VARCHAR` | `NOT NULL` | Product Name (e.g. Shirt, Shoe) |
| `quantity` | `INT` | `NOT NULL` | Order count |

### `Payments` (Disbursements) Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | `PRIMARY KEY` | Unique payment ledger UUID |
| `userId` | `VARCHAR` | `REFERENCES Users(id)`| Target recipient |
| `amount` | `INT` | `NOT NULL` | Cash disbursed |
| `paymentMethod` | `VARCHAR` | `NOT NULL` | Payout gateway used |
| `paymentAccount`| `VARCHAR` | `NOT NULL` | Payout gateway number |
| `status` | `VARCHAR` | `DEFAULT 'Paid'` | Ledger status |
| `createdAt` | `TIMESTAMP`| `DEFAULT NOW()` | Execution datetime |

---

## 🛠️ Tech Stack & Scripts

*   **Frontend**: React (with Context State Management), Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend**: Express.js server, JWT-based Route Protections, Bcrypt hashing.
*   **Dev Engine**: `tsx` (TypeScript Executor).
*   **Production Bundler**: `esbuild` for bundling the Node.js server.

### Available Scripts
```bash
npm run dev     # Starts full stack server in dev mode with live HMR
npm run build   # Compiles frontend assets and bundles server to dist/
npm run start   # Launches compiled server in production mode
```

---

## 🚀 Production Deployment Guide

### Option A: Google Cloud Run (Recommended Container Deployment)
1. **Prepare Dockerfile**: Build a multi-stage Docker container that runs `npm run build` and runs `npm run start` exposing port 3000.
2. **Setup Secrets**: Set `JWT_SECRET` in Google Secret Manager and bind it as an environment variable inside the Cloud Run Container.
3. **Provisioning database**: For multi-replica deployments, swap the memory-based persistent DB with a Cloud SQL PostgreSQL instance using the Prisma/Drizzle schema.

### Option B: Vercel (Serverless Deploy)
1. Import the repository into your Vercel Dashboard.
2. Ensure Vercel overrides the Build Command to `npm run build`.
3. Add environment variables:
    *   `JWT_SECRET`: A secure cryptographically signed string.
