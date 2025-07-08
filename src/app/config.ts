// Configure route behavior for the entire app
export const dynamic = 'force-dynamic'; // Makes all routes dynamic by default
export const dynamicParams = true; // Allow dynamic parameters in routes
export const revalidate = 0; // Disable static regeneration

// Explicitly disable static rendering for specific pages
export const generateStaticParams = () => {
  return [];
};

// Middleware settings
export const skipMiddlewareUrlPatterns = [
  '/_next/static/(.*)',
  '/_next/image(.*)',
  '/favicon.ico',
  '/api/(.*)',
  '/images/(.*)',
  '/fonts/(.*)',
  '/sitemap.xml',
  '/robots.txt',
];

// List of all authenticated routes 
export const authenticatedRoutes = [
  '/dashboard',
  '/cotizaciones', 
  '/cotizador',
  '/datos',
  '/clientes',
  '/productos',
]; 