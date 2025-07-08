'use client';

import { ReactNode, useState, useEffect } from "react";
import { useSafeAuth0 } from "@/hooks/use-safe-auth0";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthenticatedGuard({ children, fallback = null }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useSafeAuth0();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only use Auth0 data after client-side mount
  const shouldShow = mounted && !isLoading;

  if (!shouldShow) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
}

export function UnauthenticatedGuard({ children, fallback = null }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useSafeAuth0();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only use Auth0 data after client-side mount
  const shouldShow = mounted && !isLoading;

  if (!shouldShow) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  if (isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
} 