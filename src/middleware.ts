import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Set public routes that don't require authentication
  publicRoutes: [
    '/', 
    '/login(.*)', 
    '/register(.*)', 
    '/api/(.*)', 
    '/favicon.ico',
    '/not-found'
  ],
});

export const config = {
  matcher: [
    // Skip all internal paths (_next, static, images)
    '/((?!_next/static|_next/image).*)',
    // Optional: Allow public access to specific files in public dir
    // '/((?!_next|public/static|favicon.ico).*)'
  ],
}; 