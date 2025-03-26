'use client';

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSafeAuth0 } from "@/hooks/use-safe-auth0";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSafeAuth0();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (mounted && !isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, mounted, router]);
  
  // Show loading state while checking
  if (!mounted || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Only render children (auth forms) if not authenticated
  return (
    <div className="flex-1 flex items-center justify-center py-6">
      {children}
    </div>
  );
} 