import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static exports for Cloudflare Pages
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
