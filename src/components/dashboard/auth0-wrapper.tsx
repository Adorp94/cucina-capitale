'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeAuth0 } from '@/hooks/use-safe-auth0';

export default function DashboardAuth0Wrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSafeAuth0();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      // If not authenticated with Auth0, redirect to home
      router.push('/');
    }
  }, [isAuthenticated, isLoading, mounted, router]);
  
  // Show loading state while checking authentication
  if (!mounted || isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Verificando tu sesión...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If not authenticated, don't show anything (will redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }
  
  // If authenticated, render the children (dashboard content)
  return <>{children}</>;
} 