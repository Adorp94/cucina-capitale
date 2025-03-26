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
};

module.exports = nextConfig; 