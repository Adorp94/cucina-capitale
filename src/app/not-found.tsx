'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="es">
      <head>
        <title>404 - Página no encontrada</title>
        <meta name="description" content="La página que estás buscando no existe" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <h1 className="text-4xl font-bold mb-4">404 - Página no encontrada</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </body>
    </html>
  );
} 