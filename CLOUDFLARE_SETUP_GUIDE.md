# Cloudflare Pages Environment Variables Setup Guide

## ⚠️ CRITICAL: Complete These Steps Before Next Deployment

Your Airtable API key was previously exposed in client-side code. Follow these steps to secure your application.

---

## Step 1: Rotate Airtable API Key

### 1.1 Generate New API Key

1. Go to [Airtable Account Settings](https://airtable.com/account)
2. Click on "Personal access tokens" in the left sidebar
3. Click "Create token"
4. Give it a name: "GlamPack Warehouse - Production"
5. Under "Scopes", select:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
6. Under "Access", select your base: "Glam Manufacturing"
7. Click "Create token"
8. **COPY THE TOKEN** - you'll only see it once!

### 1.2 Update Local Environment

Open `.env.local` and replace line 17:

```bash
# Old (EXPOSED - DO NOT USE - ALREADY ROTATED)
# AIRTABLE_API_KEY=pat***REDACTED***

# New (from step 1.1)
AIRTABLE_API_KEY=YOUR_NEW_TOKEN_HERE
```

---

## Step 2: Get Firebase Admin Credentials

### 2.1 Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "glam-manufacturing"
3. Click the gear icon ⚙️ → "Project settings"
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Click "Generate key" in the popup
7. A JSON file will download - **KEEP THIS SECURE!**

### 2.2 Extract Values from JSON

Open the downloaded JSON file. You'll need two values:

```json
{
  "client_email": "firebase-adminsdk-xxxxx@glam-manufacturing.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
}
```

**Copy these values** - you'll add them to Cloudflare in the next step.

---

## Step 3: Configure Cloudflare Pages Environment Variables

### 3.1 Access Environment Variables

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click "Workers & Pages" in the left sidebar
3. Find and click your project: **glam-manufacturing**
4. Click the "Settings" tab
5. Scroll down to "Environment variables"
6. Make sure you're on the **"Production"** tab (NOT Preview)

### 3.2 Remove Old Variables

**DELETE these if they exist:**
- `NEXT_PUBLIC_AIRTABLE_API_KEY`
- `NEXT_PUBLIC_AIRTABLE_BASE_ID`

Click the "..." menu next to each and select "Delete"

### 3.3 Add New Server-Side Variables

Click "Add variable" for each of these:

#### Variable 1: AIRTABLE_API_KEY
- **Variable name:** `AIRTABLE_API_KEY`
- **Value:** Your new token from Step 1.1
- **Type:** Plain text
- **Environment:** Production
- Click "Save"

#### Variable 2: AIRTABLE_BASE_ID
- **Variable name:** `AIRTABLE_BASE_ID`
- **Value:** `appxBPjMal2Se5ZvI`
- **Type:** Plain text
- **Environment:** Production
- Click "Save"

#### Variable 3: FIREBASE_CLIENT_EMAIL
- **Variable name:** `FIREBASE_CLIENT_EMAIL`
- **Value:** The `client_email` from your JSON file (Step 2.2)
- **Type:** Plain text
- **Environment:** Production
- Click "Save"

#### Variable 4: FIREBASE_PRIVATE_KEY
- **Variable name:** `FIREBASE_PRIVATE_KEY`
- **Value:** The entire `private_key` from your JSON file (Step 2.2)
  - **IMPORTANT:** Keep the `\n` characters - they're part of the key
  - Should start with: `-----BEGIN PRIVATE KEY-----\n`
  - Should end with: `\n-----END PRIVATE KEY-----\n`
- **Type:** Secret (encrypted)
- **Environment:** Production
- Click "Save"

### 3.4 Verify Configuration

After adding all 4 variables, you should see:

```
Production Environment Variables:
✓ AIRTABLE_API_KEY (Plain text)
✓ AIRTABLE_BASE_ID (Plain text)
✓ FIREBASE_CLIENT_EMAIL (Plain text)
✓ FIREBASE_PRIVATE_KEY (Secret)
✓ NEXT_PUBLIC_FIREBASE_API_KEY (Plain text) - Already existed
✓ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (Plain text) - Already existed
✓ NEXT_PUBLIC_FIREBASE_PROJECT_ID (Plain text) - Already existed
✓ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (Plain text) - Already existed
✓ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (Plain text) - Already existed
✓ NEXT_PUBLIC_FIREBASE_APP_ID (Plain text) - Already existed
✓ NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (Plain text) - Already existed
```

**Total:** 11 environment variables

---

## Step 4: Set Up Firestore User Roles

### 4.1 Create Users Collection

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "glam-manufacturing"
3. Click "Firestore Database" in the left sidebar
4. If prompted, click "Create database"
   - Choose "Start in production mode"
   - Select your location (closest to your users)
   - Click "Enable"

### 4.2 Add Your Admin User

1. Click "Start collection"
2. Collection ID: `users`
3. Click "Next"
4. Document ID: **YOUR_FIREBASE_USER_ID**
   - To find your user ID:
     - Go to "Authentication" in Firebase Console
     - Click on "Users" tab
     - Find your email and copy the "User UID"
5. Add fields:
   - Field: `email`, Type: `string`, Value: `your-email@example.com`
   - Field: `role`, Type: `string`, Value: `admin`
   - Field: `createdAt`, Type: `timestamp`, Value: (click "Set to current time")
6. Click "Save"

### 4.3 Set Firestore Security Rules

1. In Firestore Database, click "Rules" tab
2. Replace with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // Only admins can write (managed server-side)
      allow write: if false;
    }
  }
}
```

3. Click "Publish"

---

## Step 5: Trigger New Deployment

Now that environment variables are configured, trigger a new deployment:

### Option A: Retry Deployment (Recommended)
1. In Cloudflare Pages, go to "Deployments" tab
2. Find the latest deployment
3. Click the "..." menu
4. Click "Retry deployment"

### Option B: Push New Commit
Just push any commit to your repository:
```bash
git commit --allow-empty -m "Trigger deployment with new environment variables"
git push
```

---

## Step 6: Verify Deployment

### 6.1 Check Build Logs

1. Go to "Deployments" tab in Cloudflare
2. Click on the latest deployment
3. Look for these lines in the build output:
   ```
   ✓ Compiled successfully
   ✓ Generating static pages
   ```
4. Should NOT see any errors about missing environment variables

### 6.2 Test in Browser

1. Open your deployed site: `https://glam-manufacturing.pages.dev`
2. Open browser console (F12)
3. You should NOT see:
   - "Firebase API Key is missing"
   - "Airtable API key" anywhere in the page source
4. Try logging in - should work normally

---

## ✅ Verification Checklist

- [ ] New Airtable API key generated
- [ ] Old Airtable key rotated/deleted from Airtable dashboard
- [ ] Firebase service account JSON downloaded
- [ ] All 4 new environment variables added to Cloudflare Production
- [ ] Old NEXT_PUBLIC_AIRTABLE_* variables deleted from Cloudflare
- [ ] Firestore users collection created
- [ ] Your user set as admin in Firestore
- [ ] Firestore security rules updated
- [ ] New deployment triggered
- [ ] Deployment successful (no errors)
- [ ] Site loads correctly in browser
- [ ] Login works
- [ ] No exposed API keys in browser console or page source

---

## 🆘 Troubleshooting

### "Firebase Admin not initialized" error
**Cause:** Missing or incorrect Firebase credentials

**Fix:**
1. Double-check `FIREBASE_PRIVATE_KEY` in Cloudflare
2. Make sure it includes `\n` characters (newlines)
3. Should be exactly as shown in the JSON file

### "Airtable error: Invalid API key"
**Cause:** Wrong Airtable token or not properly saved

**Fix:**
1. Verify token in Cloudflare matches the one from Airtable
2. Make sure you clicked "Save" after adding the variable
3. Trigger a new deployment after saving

### "User role not found"
**Cause:** User not added to Firestore or wrong UID

**Fix:**
1. Verify your document ID in Firestore matches your Firebase Auth UID
2. Check that `role` field is exactly `admin` (lowercase)

---

## 📋 Next Steps After Setup

Once all environment variables are configured:

1. **Test the application** thoroughly
2. **Monitor error logs** in Cloudflare deployment logs
3. **Continue with Phase 1B** implementation (API routes)
4. Add other users to Firestore with appropriate roles

---

## 🔒 Security Reminders

- **NEVER** commit the Firebase service account JSON to git
- **NEVER** share your Airtable API key
- **ALWAYS** use "Secret" type for sensitive values in Cloudflare
- **ROTATE** keys immediately if they're ever exposed

---

Need help? Check `IMPLEMENTATION_STATUS.md` for overall progress.

Last Updated: 2025-12-26
