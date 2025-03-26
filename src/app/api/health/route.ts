// Simple health check endpoint that doesn't use any server-only modules
export async function GET() {
  return Response.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
} 