import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  env: {
    // Bridges the server-only ENABLE_DEMO_LOGIN into a client-readable value at build time,
    // so only one Railway variable needs to be set instead of two independently-named ones
    // that can drift out of sync (login/page.tsx used to read its own NEXT_PUBLIC_ copy).
    NEXT_PUBLIC_ENABLE_DEMO_LOGIN: process.env.ENABLE_DEMO_LOGIN,
  },
};

export default nextConfig;
