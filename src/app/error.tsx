'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import NoAuthWrapper from '@/components/no-auth-wrapper';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <NoAuthWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Algo salió mal</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Intentar de nuevo
          </button>
          <Link 
            href="/"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </NoAuthWrapper>
  );
} 