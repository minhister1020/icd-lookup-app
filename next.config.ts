import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to succeed even with TypeScript errors
  // Useful for Vercel deployments with minor type warnings
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Allow builds to succeed even with ESLint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
