# Cloudflare Pages Deployment Checklist

## Quick Reference - Environment Variables Setup

### 🎯 What You Need

Before starting, gather:
1. ✅ New Airtable API key (from previous session: `patEKI2xSku98rcQM...`)
2. ✅ Airtable Base ID: `appxBPjMal2Se5ZvI`
3. 📥 Firebase service account JSON (download from Firebase Console)
4. 🔑 Your Firebase Auth User ID (for admin setup)

---

## Step-by-Step Configuration

### 1️⃣ Cloudflare Pages Environment Variables

Go to: **Cloudflare Dashboard → Workers & Pages → glam-manufacturing → Settings → Environment variables**

#### Add These 4 Variables (Production):

| Variable Name | Value | Type | Notes |
|---------------|-------|------|-------|
| `AIRTABLE_API_KEY` | `patEKI2xSku98rcQM...` | Plain text | New rotated key |
| `AIRTABLE_BASE_ID` | `appxBPjMal2Se5ZvI` | Plain text | Your base ID |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@glam-manufacturing.iam.gserviceaccount.com` | Plain text | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | **Secret** | Keep `\n` characters! |

#### Remove These Variables (if they exist):
- ❌ `NEXT_PUBLIC_AIRTABLE_API_KEY`
- ❌ `NEXT_PUBLIC_AIRTABLE_BASE_ID`

---

### 2️⃣ Cloudflare Build Settings

Go to: **Settings → Builds & deployments**

#### Build Configuration:
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: (leave empty)
Node.js version: 18.17.0 or higher
```

#### Environment Variables (Build):
No special build environment variables needed - all are in Production environment.

---

### 3️⃣ Firestore Setup

#### A. Create users collection:

1. Firebase Console → Firestore Database → Start collection
2. Collection ID: `users`
3. Add first document:

```
Document ID: <YOUR_FIREBASE_AUTH_UID>
Fields:
  - email: "your-email@example.com" (string)
  - role: "admin" (string)
  - createdAt: <current timestamp>
```

**To find your UID:**
- Firebase Console → Authentication → Users → Copy "User UID"

#### B. Set Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // Only server-side (admin SDK) can write
      allow write: if false;
    }
  }
}
```

---

### 4️⃣ Deploy

#### Option A: Retry Latest Deployment
```
Cloudflare Dashboard → Deployments → Latest → ⋯ → Retry deployment
```

#### Option B: Push New Commit
```bash
git commit --allow-empty -m "Configure production environment"
git push
```

---

## ✅ Verification Steps

### After Deployment:

1. **Check Build Logs**
   - ✓ No TypeScript errors
   - ✓ No environment variable errors
   - ✓ Build completes successfully

2. **Test Live Site**
   - Open `https://glam-manufacturing.pages.dev`
   - Login with your Firebase account
   - Check browser console - NO exposed API keys
   - Test navigation to different pages

3. **Test API Routes** (after login)
   - Open browser DevTools → Network tab
   - Navigate to `/inventory/finished-goods`
   - Should see API call to `/api/finished-goods`
   - Response should have data (not 401/403)

---

## 🐛 Common Issues

### Issue: "Firebase Admin not initialized"
**Fix:** Check `FIREBASE_PRIVATE_KEY` includes `\n` characters literally (not actual line breaks)

### Issue: "Unauthorized - Missing token"
**Fix:**
1. Make sure you're logged in to Firebase Auth
2. Check that your user exists in Firestore `users` collection
3. Verify `role: "admin"` is set

### Issue: "Build failed - Cannot find module"
**Fix:**
1. Check Node.js version is 18+
2. Verify `package.json` dependencies are correct
3. Clear Cloudflare build cache and retry

### Issue: "Airtable error"
**Fix:**
1. Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are set correctly
2. Check token has correct scopes (data.records:read/write)
3. Confirm base access is granted

---

## 📊 Current Status

After completing these steps, you'll have:

- ✅ Secure server-side API routes (no exposed keys)
- ✅ Firebase Authentication working
- ✅ Role-based access control functional
- ✅ All 17 API routes deployed and operational

**Next:** Update page components to use API routes instead of direct Airtable calls

---

## 📚 Additional Documentation

- Full setup guide: [CLOUDFLARE_SETUP_GUIDE.md](CLOUDFLARE_SETUP_GUIDE.md)
- Phase status: [PHASE_1B_SUMMARY.md](PHASE_1B_SUMMARY.md)
- API field mappings: [API_FIELD_MAPPING_GUIDE.md](API_FIELD_MAPPING_GUIDE.md)

---

Last Updated: 2025-12-26
