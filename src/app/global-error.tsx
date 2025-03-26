'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <head>
        <title>Error - Cucina Capitale</title>
        <meta name="description" content="Ocurrió un error inesperado" />
      </head>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-6">
            <h1 className="text-3xl font-bold mb-4">Algo salió mal</h1>
            <p className="mb-6 text-gray-600">
              Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.
            </p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 