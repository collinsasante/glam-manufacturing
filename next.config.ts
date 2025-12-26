import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages supports Next.js API routes via Node.js runtime
  // No need for static export - API routes require server-side execution
  images: {
    unoptimized: true, // Required for Cloudflare Pages
  },
};

export default nextConfig;
