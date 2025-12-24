# Cloudflare Pages Deployment Guide

This guide will help you deploy your GlamPack Warehouse Management System to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account (free tier works)
2. Git repository pushed to GitHub
3. Node.js 18+ installed locally

## Deployment Steps

### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to "Workers & Pages"
   - Click "Create application" → "Pages" → "Connect to Git"

2. **Connect Your Repository**
   - Select your GitHub account
   - Choose the `glam-manufacturing` repository
   - Click "Begin setup"

3. **Configure Build Settings**
   ```
   Project name: glampack-warehouse
   Production branch: main
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: .next
   Root directory: /glampack-warehouse
   Node version: 18
   ```

4. **Add Environment Variables**
   Go to "Settings" → "Environment variables" and add all variables from your `.env.local` file:

   **Firebase Configuration:**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

   **Airtable Configuration:**
   ```
   NEXT_PUBLIC_AIRTABLE_API_KEY=your_airtable_api_key
   NEXT_PUBLIC_AIRTABLE_BASE_ID=your_airtable_base_id
   ```

   **Important:** Use the actual values from your local `.env.local` file.

5. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will build and deploy your application
   - You'll get a URL like: `https://glampack-warehouse.pages.dev`

### Option 2: Deploy via Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   cd /Users/breezyyy/Downloads/Glam-Manufacturing/glampack-warehouse
   npx wrangler pages deploy .next --project-name=glampack-warehouse
   ```

4. **Set Environment Variables**
   ```bash
   wrangler pages secret put NEXT_PUBLIC_FIREBASE_API_KEY
   wrangler pages secret put NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   wrangler pages secret put NEXT_PUBLIC_FIREBASE_PROJECT_ID
   wrangler pages secret put NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   wrangler pages secret put NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   wrangler pages secret put NEXT_PUBLIC_FIREBASE_APP_ID
   wrangler pages secret put NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
   wrangler pages secret put NEXT_PUBLIC_AIRTABLE_API_KEY
   wrangler pages secret put NEXT_PUBLIC_AIRTABLE_BASE_ID
   ```

## Next.js Configuration for Cloudflare

Add this to your `next.config.js` if not already present:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static exports for Cloudflare Pages
  images: {
    unoptimized: true, // Required for static export
  },
};

module.exports = nextConfig;
```

**Note:** For Cloudflare Pages with Next.js, you may need to use the `@cloudflare/next-on-pages` adapter for full SSR support.

## Alternative: Full Next.js SSR Support

For full Next.js features (SSR, API Routes), use the Cloudflare adapter:

1. **Install the adapter**
   ```bash
   npm install --save-dev @cloudflare/next-on-pages
   ```

2. **Update `next.config.js`**
   ```javascript
   const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');

   if (process.env.NODE_ENV === 'development') {
     setupDevPlatform();
   }

   /** @type {import('next').NextConfig} */
   const nextConfig = {
     // Your existing config
   };

   module.exports = nextConfig;
   ```

3. **Update build command in Cloudflare**
   ```
   Build command: npx @cloudflare/next-on-pages
   Build output directory: .vercel/output/static
   ```

## Custom Domain Setup

1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter your domain (e.g., `warehouse.glampack.com`)
5. Cloudflare will automatically configure DNS

## Continuous Deployment

- Every push to your `main` branch will automatically trigger a deployment
- Pull requests create preview deployments
- You can rollback to previous deployments from the dashboard

## Troubleshooting

### Build Failures
- Check build logs in Cloudflare dashboard
- Ensure all environment variables are set
- Verify Node version is 18+

### Runtime Errors
- Check Functions logs in Cloudflare dashboard
- Verify Firebase and Airtable credentials are correct
- Check CORS settings if API calls fail

### Image Issues
- Ensure `images.unoptimized = true` in next.config.js
- All images must be in the `/public` directory

## Support

For issues:
- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Next.js on Cloudflare: https://developers.cloudflare.com/pages/framework-guides/nextjs/

## Your Deployment URL

Once deployed, your app will be available at:
- Production: `https://glampack-warehouse.pages.dev`
- Custom domain (if configured): `https://your-domain.com`
