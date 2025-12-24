import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No static export - use SSR for dynamic routes and API data
  images: {
    unoptimized: true, // Cloudflare Pages compatibility
  },
};

export default nextConfig;
