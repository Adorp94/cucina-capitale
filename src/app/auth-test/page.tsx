'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSafeAuth0 } from "@/hooks/use-safe-auth0";
import Link from "next/link";

// This is a test page for Auth0 authentication
export default function AuthTestPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useSafeAuth0();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only use Auth0 data after client-side mount
  const shouldShow = mounted && !isLoading;

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router, mounted]);

  if (!shouldShow) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <h1 className="text-2xl font-bold mb-6">Auth0 Testing Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Bienvenido, {user?.name}</h2>
        <p className="text-gray-600 mb-4">
          Has iniciado sesión correctamente con Auth0.
        </p>
        
        <Link 
          href="/dashboard" 
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-950"
        >
          Ir al Dashboard Principal
        </Link>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Información de usuario</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium mb-2">Próximos pasos</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-600">
          <li>
            <strong>Ir al <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard principal</Link></strong> - Accede a la interfaz principal de la aplicación
          </li>
          <li>Integrar Auth0 con la funcionalidad existente de la aplicación</li>
          <li>Configurar roles y permisos para diferentes usuarios</li>
        </ol>
      </div>
    </div>
  );
} 