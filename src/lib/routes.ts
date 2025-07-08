/**
 * Configuration for routes in the application
 */

// Public routes that don't require authentication
export const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)', // Health check API
  '/not-found',
  '/favicon.ico',
  '/_next/(.*)' // Next.js static assets
];

// Routes that require authentication
export const protectedRoutes = [
  '/dashboard',
  '/cotizaciones',
  '/cotizador(.*)',
  '/datos',
  '/clientes',
  '/productos'
];

// Routes to redirect to after authentication
export const afterAuthRoutes = {
  signIn: '/dashboard',
  signUp: '/dashboard'
}; 