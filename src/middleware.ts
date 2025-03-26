import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Create a matcher for public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/sso-callback(.*)',
]);

// Create a matcher for protected routes that need dynamic rendering
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/cotizador(.*)',
  '/cotizaciones(.*)',
  '/clientes(.*)',
  '/productos(.*)',
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