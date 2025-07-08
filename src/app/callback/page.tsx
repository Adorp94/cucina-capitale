'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeAuth0 } from '@/hooks/use-safe-auth0';

export default function CallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSafeAuth0();

  useEffect(() => {
    if (!isLoading) {
      // After Auth0 finishes loading, redirect to appropriate page
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Procesando tu inicio de sesión...</p>
      </div>
    </div>
  );
} 