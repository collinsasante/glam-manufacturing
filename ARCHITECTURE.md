# GlamPack Warehouse - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Next.js UI  │  │   Firebase   │  │    Toast     │              │
│  │  Components  │  │     Auth     │  │  Notifications│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│           │                │                                          │
└───────────┼────────────────┼──────────────────────────────────────────┘
            │                │
            │                │ ID Token
            ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES (Node.js)                        │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Next.js API Routes                           │ │
│  │                                                                  │ │
│  │  /api/suppliers          /api/finished-goods                   │ │
│  │  /api/raw-materials      /api/stock-movement                   │ │
│  │  /api/deliveries         /api/stock-transfer                   │ │
│  │  /api/manufacturing      /api/warehouses/[type]                │ │
│  │  /api/users/me                                                  │ │
│  │                                                                  │ │
│  │  Each route:                                                    │ │
│  │  1. ✓ Verify Firebase ID Token                                 │ │
│  │  2. ✓ Get user role from Firestore                             │ │
│  │  3. ✓ Check RBAC permissions                                   │ │
│  │  4. ✓ Validate input with Zod                                  │ │
│  │  5. ✓ Execute Airtable operation                               │ │
│  │  6. ✓ Return JSON response                                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           │                        │                                  │
└───────────┼────────────────────────┼──────────────────────────────────┘
            │                        │
            ▼                        ▼
┌──────────────────────┐   ┌─────────────────────┐
│   Firebase Admin     │   │     Airtable API    │
│                      │   │                     │
│  ┌────────────────┐ │   │  ┌──────────────┐  │
│  │  Firestore DB  │ │   │  │  Suppliers   │  │
│  │                │ │   │  │  Raw Mtls    │  │
│  │  users/        │ │   │  │  Finished    │  │
│  │    {uid}       │ │   │  │  Stock Mvmt  │  │
│  │      role      │ │   │  │  Stock Xfer  │  │
│  │      email     │ │   │  │  Deliveries  │  │
│  └────────────────┘ │   │  │  Mfg Orders  │  │
│                      │   │  └──────────────┘  │
│  ┌────────────────┐ │   │                     │
│  │ Token Verify   │ │   │  Base ID:           │
│  │ (Admin SDK)    │ │   │  appxBPjMal2Se5ZvI  │
│  └────────────────┘ │   │                     │
└──────────────────────┘   └─────────────────────┘
```

---

## 🔒 Security Layers

### Layer 1: Client-Side (Firebase Auth)
```javascript
// contexts/AuthContext.tsx
- User logs in with Firebase Auth
- Gets ID token
- Token automatically included in API requests
- If no token → redirect to /login
```

### Layer 2: Server-Side Authentication
```javascript
// All API routes
const token = request.headers.get('authorization')?.substring(7);
const decodedToken = await verifyIdToken(token);  // Firebase Admin SDK
// If invalid → 401 Unauthorized
```

### Layer 3: Authorization (RBAC)
```javascript
// All API routes
const role = await getUserRole(decodedToken.uid);  // Query Firestore
if (!hasPermission(role, Permission.VIEW_SUPPLIERS)) {
  return 403 Forbidden
}
```

### Layer 4: Input Validation
```javascript
// All POST/PATCH routes
const validationResult = supplierSchema.safeParse(body);  // Zod
if (!validationResult.success) {
  return 400 Bad Request
}
```

---

## 📊 Data Flow Example

### Example: Viewing Finished Goods List

```
1. User navigates to /inventory/finished-goods

2. Page component calls:
   const token = await user.getIdToken();
   const response = await fetch('/api/finished-goods', {
     headers: { 'Authorization': `Bearer ${token}` }
   });

3. API Route Handler (/api/finished-goods/route.ts):
   ✓ Verify token with Firebase Admin
   ✓ Get user role from Firestore users/{uid}
   ✓ Check if role has VIEW_FINISHED_GOODS permission
   ✓ Query Airtable: base('Finished Goods').select().all()
   ✓ Transform fields to match schema
   ✓ Return JSON: { data: goods[], count: number }

4. Page component:
   ✓ Receive data
   ✓ Render table
   ✓ Show success/error toast
```

---

## 🔑 Environment Variables

### Production (Cloudflare Pages)

#### Server-Side Only (NOT exposed to browser):
```
AIRTABLE_API_KEY=patEKI2xSku98rcQM...
AIRTABLE_BASE_ID=appxBPjMal2Se5ZvI
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@glam-manufacturing.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

#### Client-Side (Safe to expose):
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=glam-manufacturing.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=glam-manufacturing
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=glam-manufacturing.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

---

## 👥 Role-Based Access Control (RBAC)

### Roles Hierarchy:
```
admin    → All permissions (40+)
  └─ manager → Subset of admin permissions
      └─ staff → Limited operational permissions
          └─ viewer → Read-only access
```

### Permission Examples:
```javascript
// Suppliers
VIEW_SUPPLIERS
CREATE_SUPPLIER
UPDATE_SUPPLIER
DELETE_SUPPLIER

// Inventory
VIEW_FINISHED_GOODS
VIEW_RAW_MATERIALS
CREATE_FINISHED_GOOD
UPDATE_STOCK

// Operations
VIEW_DELIVERIES
CREATE_DELIVERY
VIEW_MANUFACTURING
CREATE_MANUFACTURING_ORDER
```

**Total Permissions:** 40+

---

## 📁 Key Files Reference

### API Routes (17 files)
```
app/api/
├── suppliers/
│   ├── route.ts                    # GET list, POST create
│   └── [id]/route.ts              # GET one, PATCH update, DELETE
├── raw-materials/
│   ├── route.ts
│   └── [id]/route.ts
├── finished-goods/
│   ├── route.ts
│   └── [id]/route.ts
├── stock-movement/
│   ├── route.ts
│   └── [id]/route.ts
├── stock-transfer/
│   ├── route.ts
│   └── [id]/route.ts
├── deliveries/
│   ├── route.ts
│   └── [id]/route.ts
├── manufacturing/
│   ├── route.ts
│   └── [id]/route.ts
├── warehouses/
│   └── [type]/route.ts            # Dynamic warehouse queries
└── users/
    └── me/route.ts                # Current user profile
```

### Core Libraries
```
lib/
├── firebase-admin.ts              # Server-side Firebase init
├── firebase.ts                    # Client-side Firebase init
├── rbac.ts                        # Permissions & roles
├── validations.ts                 # Zod schemas
├── errors.ts                      # Error handling
└── api-client.ts                  # Fetch wrapper (future use)
```

### Context & Components
```
contexts/
└── AuthContext.tsx                # Firebase auth + role fetching

components/
├── error-boundary.tsx             # React error boundary
└── Toaster.tsx                    # Toast notifications
```

---

## 🚀 Deployment Flow

```
1. Developer pushes to GitHub
   │
   ├──> GitHub webhook triggers Cloudflare
   │
2. Cloudflare Pages Build
   │
   ├──> npm install
   ├──> npm run build (Next.js)
   ├──> TypeScript compilation ✓
   ├──> Bundle optimization
   │
3. Environment Variables Injected
   │
   ├──> Server env vars loaded (AIRTABLE_*, FIREBASE_*)
   ├──> Public env vars included in bundle (NEXT_PUBLIC_*)
   │
4. Deploy to Edge Network
   │
   ├──> Static pages → CDN
   ├──> API routes → Cloudflare Workers (Node.js)
   │
5. Live at: glam-manufacturing.pages.dev
```

---

## 📈 Performance Considerations

### API Routes:
- **Dynamic rendering** (`export const dynamic = 'force-dynamic'`)
- Server-side execution on every request
- No caching (real-time data)

### Static Pages:
- Pre-rendered at build time
- Served from CDN edge locations
- Fast initial load

### Database Queries:
- Airtable: ~100-500ms per query
- Firestore: ~50-200ms per query
- Total API response: ~200-700ms

---

## 🔄 Current vs. Future State

### Current (Direct Airtable):
```javascript
// Page component directly queries Airtable
const records = await tables.suppliers.select().all();
```
**Problem:** Exposes API key to browser

### Target (API Routes):
```javascript
// Page component calls secure API route
const token = await user.getIdToken();
const { data } = await fetch('/api/suppliers', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```
**Benefits:**
- ✓ API key secure on server
- ✓ Authentication required
- ✓ Authorization enforced
- ✓ Input validation
- ✓ Consistent error handling

---

Last Updated: 2025-12-26
