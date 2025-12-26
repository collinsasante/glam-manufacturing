# GlamPack Warehouse Management System

A production-ready, secure warehouse and supply chain management system with role-based access control, Firebase authentication, and Airtable backend.

**Status:** Phase 1 Complete - Ready for Cloudflare Pages Deployment ✅

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

## ✨ Features

### Inventory Management
- **Raw Materials** - Track materials, specifications, unit costs, current stock
- **Finished Goods** - Manage products, pack sizes, prices, availability
- **Stock Movement** - In/Out transactions with unit costs and reasons
- **Stock Transfer** - Inter-warehouse transfers with batch tracking

### Operations
- **Suppliers** - Contact information, addresses, websites
- **Deliveries** - Customer deliveries with rider assignment
- **Manufacturing** - Production orders with quantity and status tracking
- **Warehouses** - Multi-warehouse support (General, Raw Material, Finished Goods, Oyarifa Retail, AZ Bulk)

### Security & Access Control
- **Firebase Authentication** - Secure user login with email/password
- **Role-Based Access Control (RBAC)** - 4 roles (admin, manager, staff, viewer) with 40+ granular permissions
- **Secure API Routes** - All Airtable operations go through authenticated server-side routes
- **Input Validation** - Zod schemas validate all user inputs
- **Error Handling** - Consistent error responses with proper HTTP status codes

### Dashboard
- Real-time statistics and metrics
- Quick access to all modules
- Modern, professional UI

## 🏗️ Tech Stack

### Frontend
- **Next.js 16.1.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **Sonner** - Toast notifications

### Backend & Services
- **Airtable** - Database for all business data
- **Firebase Authentication** - User authentication (client-side)
- **Firebase Admin SDK** - Token verification and Firestore access (server-side)
- **Firestore** - User roles and profiles storage

### Validation & Error Handling
- **Zod** - Runtime type validation
- **Custom Error Classes** - ApiError, ValidationError, AuthenticationError
- **Error Boundary** - React error boundary for graceful failures

### Deployment
- **Cloudflare Pages** - Hosting with Node.js runtime for API routes
- **Environment Variables** - Server-side secrets (no client exposure)

## 📁 Project Structure

```
glampack-warehouse/
├── app/
│   ├── api/              # 17 secure API routes with RBAC
│   ├── inventory/        # Inventory management pages
│   ├── warehouses/       # Warehouse-specific views
│   ├── deliveries/       # Delivery tracking
│   ├── manufacturing/    # Production orders
│   ├── suppliers/        # Supplier management
│   └── login/signup/     # Authentication pages
├── components/           # Reusable UI components
├── contexts/            # React contexts (AuthContext)
├── lib/
│   ├── rbac.ts          # Role-based access control system
│   ├── firebase.ts      # Firebase client configuration
│   ├── firebase-admin.ts # Firebase Admin SDK
│   ├── validations.ts   # Zod validation schemas
│   ├── errors.ts        # Error handling utilities
│   └── api-client.ts    # Type-safe API client
├── types/               # TypeScript type definitions
└── docs/                # Documentation (see below)
```

## 📚 Documentation

**Start here for deployment:**
- [READY_FOR_DEPLOYMENT.md](READY_FOR_DEPLOYMENT.md) - Complete deployment overview
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Step-by-step Cloudflare setup

**Architecture & Implementation:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and data flow
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Current progress (62% complete)
- [PHASE_1B_SUMMARY.md](PHASE_1B_SUMMARY.md) - Phase 1B implementation details

**Reference:**
- [CLOUDFLARE_SETUP_GUIDE.md](CLOUDFLARE_SETUP_GUIDE.md) - Complete Cloudflare configuration
- [API_FIELD_MAPPING_GUIDE.md](API_FIELD_MAPPING_GUIDE.md) - Airtable field mappings

## 🔒 Security Features

### Multi-Layer Security Architecture
1. **Client-Side:** Firebase Authentication with ID tokens
2. **Server-Side:** Token verification via Firebase Admin SDK
3. **Authorization:** RBAC with granular permissions
4. **Validation:** Zod schema validation on all API inputs
5. **Secrets Management:** All API keys stored server-side only

### Roles & Permissions
- **Admin** - Full system access (40+ permissions)
- **Manager** - Operational management (subset of admin)
- **Staff** - Day-to-day operations (limited permissions)
- **Viewer** - Read-only access

### API Route Security Pattern
All 17 API routes follow this pattern:
1. Verify Firebase ID token from Authorization header
2. Get user role from Firestore
3. Check RBAC permissions
4. Validate request body with Zod
5. Execute Airtable operation
6. Return consistent error responses

## 🚀 Deployment to Cloudflare Pages

### Prerequisites
1. New Airtable API key (rotated for security)
2. Firebase service account JSON (for Admin SDK)
3. Cloudflare Pages account
4. Firestore users collection set up

### Environment Variables Required

**Cloudflare Pages Production:**
```
AIRTABLE_API_KEY=<your-new-api-key>
AIRTABLE_BASE_ID=appxBPjMal2Se5ZvI
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_PRIVATE_KEY=<from-service-account-json>
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-firebase-auth-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-firebase-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-firebase-storage-bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-firebase-app-id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<your-firebase-measurement-id>
```

**See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed setup instructions.**

## 📊 Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1A - Infrastructure | ✅ Complete | 100% |
| Phase 1B - API Routes | ✅ Complete | 100% |
| Cloudflare Configuration | ⏳ In Progress | 0% (user action required) |
| Phase 2 - Frontend Migration | 🔜 Pending | 0% |
| Phase 3 - Error Handling | 🔜 Pending | 29% |

**Overall Progress:** 62%

## 🎯 Next Steps

1. **Configure Cloudflare Pages** environment variables (see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md))
2. **Set up Firestore** users collection with admin role
3. **Deploy to Cloudflare** and verify build succeeds
4. **Migrate frontend** components to use API routes (Phase 2)
5. **Replace alert() calls** with toast notifications
6. **Fix empty catch blocks** with proper error handling

## 🛠️ Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📝 License

Private - GlamPack Manufacturing

---

**Last Updated:** 2025-12-26
**Version:** 1.0.0 (Phase 1 Complete)
