import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Create a matcher for public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/sso-callback(.*)',
  '/api/(.*)', // Allow API routes to be accessed without authentication
  '/_next/(.*)' // Allow Next.js assets to be accessed without authentication
]);

// Create a matcher for protected routes that need dynamic rendering
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/cotizador(.*)',
  '/cotizaciones(.*)',
  '/clientes(.*)',
  '/productos(.*)',
]);

// Add security headers to all responses
function addSecurityHeaders(response: NextResponse) {
  // Add common security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

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
      const response = NextResponse.redirect(url);
      return addSecurityHeaders(response);
    }
    
    // Continue to the next middleware and apply security headers
    const response = evt.next();
    return addSecurityHeaders(response);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next/static|_next/image|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 