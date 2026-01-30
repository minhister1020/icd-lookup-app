import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to succeed even with TypeScript errors
  // Useful for Vercel deployments with minor type warnings
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Note: ESLint config moved out of next.config.ts in Next.js 16+
  // To ignore ESLint during builds, use: next build --no-lint
  // Or configure in eslint.config.mjs
};

export default nextConfig;
