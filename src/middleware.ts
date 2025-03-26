import { clerkMiddleware } from "@clerk/nextjs/server";
import { publicRoutes } from "@/lib/routes";

// Export the Clerk middleware with a simplified configuration
export default clerkMiddleware({
  // Set public routes that don't require authentication
  publicRoutes: [
    ...publicRoutes,
    '/not-found',
    '/favicon.ico',
    '/_next/(.*)' // Important for Vercel static assets
  ],
});

// Configure matcher to exclude static files
export const config = {
  matcher: [
    // Skip all internal paths (_next, static, images)
    '/((?!_next/static|_next/image).*)',
  ],
}; 