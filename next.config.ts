import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // 🚨 Ignore type errors during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // 🚨 Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
