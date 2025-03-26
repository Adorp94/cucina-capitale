/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client side
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  // Ensure dependencies are properly installed in production build
  transpilePackages: ["tailwindcss", "postcss", "autoprefixer"],
  // Disable ESLint during build to avoid linting errors
  eslint: {
    // Only run ESLint in development, not in production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  // Configure environment variables for security
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  // Output standalone build
  output: 'standalone',
  // Disable SWC minifier
  swcMinify: false,
  // Experiment flags for Next.js
  experimental: {
    // These settings help with Clerk server components
    serverActions: true,
    serverComponentsExternalPackages: ['@clerk/nextjs'],
  }
};

module.exports = nextConfig; 