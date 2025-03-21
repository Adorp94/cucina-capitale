import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Create a matcher that prevents middleware from running on auth routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/sso-callback(.*)',
]);

export default clerkMiddleware({
  publicRoutes: (req) => isPublicRoute(req),
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 