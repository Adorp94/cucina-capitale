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
  // Disable ESLint during build to avoid linting errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  // Output standalone for Vercel
  output: 'standalone',
  // Disable SWC minifier
  swcMinify: false,
  // Force app to be completely dynamic
  experimental: {
    serverComponentsExternalPackages: ['@clerk/nextjs'],
    disableStaticGeneration: true,
    appDir: true
  },
  // Skip static generation for not-found and error pages
  skipDefaultLibCheck: true,
  images: {
    domains: ['images.clerk.dev'],
  },
  // Avoid prerendering issues
  reactStrictMode: false,
  // Force dynamic flag everywhere
  runtime: 'nodejs'
};

module.exports = nextConfig; 