'use client';

import { useAuth0 } from "@auth0/auth0-react";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthenticatedGuard({ children, fallback = null }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
}

export function UnauthenticatedGuard({ children, fallback = null }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  if (isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
} 