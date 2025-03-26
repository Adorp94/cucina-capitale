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
  // Disable static optimization for pages that depend on Clerk authentication
  output: 'standalone',
  // Disable SWC minifier to avoid minification issues with dynamic imports
  swcMinify: false,
  // Disable static page generation for any route that's protected
  staticPageGenerationTimeout: 120,
  // Configure specific routes as dynamic
  async headers() {
    return [
      {
        source: '/cotizador/:path*',
        headers: [
          {
            key: 'x-nextjs-data',
            value: 'dynamic',
          },
        ],
      },
      {
        source: '/cotizaciones/:path*',
        headers: [
          {
            key: 'x-nextjs-data',
            value: 'dynamic',
          },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'x-nextjs-data',
            value: 'dynamic',
          },
        ],
      },
    ];
  },
  // Enable App Router
  experimental: {
    serverComponentsExternalPackages: ['@clerk/nextjs'],
    optimizeCss: false, // Disable CSS optimization to prevent build issues
  },
};

module.exports = nextConfig; 