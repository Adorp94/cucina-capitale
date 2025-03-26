/**
 * Configuration for routes in the application
 */

// Public routes that don't require authentication
export const publicRoutes = [
  '/',
  '/login',
  '/sign-in',
  '/register',
  '/sign-up',
  '/reset-password',
  '/api/(.*)', // API routes
  '/callback', // Auth0 callback route
  '/auth-test', // Auth0 test page
  '/not-found',
  '/favicon.ico',
  '/_next/(.*)' // Next.js static assets
];

// Routes that require authentication
export const protectedRoutes = [
  '/dashboard',
  '/cotizaciones',
  '/cotizador(.*)',
  '/clientes',
  '/productos'
];

// Routes to redirect to after authentication
export const afterAuthRoutes = {
  signIn: '/dashboard',
  signUp: '/dashboard'
}; 