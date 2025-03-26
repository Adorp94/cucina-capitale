import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { publicRoutes, protectedRoutes } from "@/lib/routes";

// Simple middleware function that doesn't require authentication
// Auth0 authentication will be handled at the page/layout level
export default function middleware(request: NextRequest) {
  // Allow public routes without authentication
  const { pathname } = request.nextUrl;
  
  const isPublicRoute = publicRoutes.some(
    route => {
      if (route.includes('(.*)')) {
        // Handle wildcard routes
        const baseRoute = route.replace('(.*)', '');
        return pathname === baseRoute || pathname.startsWith(baseRoute);
      }
      return pathname === route;
    }
  );
  
  // Auth0 auth page and callback
  if (pathname === '/callback' || pathname === '/auth-test') {
    return NextResponse.next();
  }
  
  // Don't force redirection for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For all other routes, we'll let the client-side Auth0 handle authentication
  return NextResponse.next();
}

// Configure matcher to exclude static files
export const config = {
  matcher: [
    // Skip all internal paths (_next, static, images)
    '/((?!_next/static|_next/image).*)',
  ],
}; 