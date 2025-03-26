import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Create a matcher for public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/sso-callback(.*)',
  '/api/(.*)' // Allow API routes to be accessed without authentication
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
  debug: process.env.NODE_ENV === 'development',
  // Add a custom handler for when authentication fails
  afterAuth: (auth, req, evt) => {
    // Handle routing based on authentication
    if (!auth.isPublicRoute && !auth.isSignedIn && !isPublicRoute(req)) {
      // Handle redirects for client-side routes
      const url = new URL('/login', req.url);
      url.searchParams.set("redirect_url", req.url);
      return Response.redirect(url);
    }
    
    return evt.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 