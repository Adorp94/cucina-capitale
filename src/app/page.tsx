'use client';

import Image from "next/image";
import Link from "next/link";
import { useAuth0 } from "@auth0/auth0-react";
import { AuthenticatedGuard, UnauthenticatedGuard } from "@/components/auth/auth-guard";
import LoginButton from "@/components/auth/login-button";

export default function HomePage() {
  const { isLoading } = useAuth0();

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Bienvenido a Cucina Capitale
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Sistema de gestión para carpintería residencial
                </p>
              </div>
              
              {isLoading ? (
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <AuthenticatedGuard>
                    <Link 
                      href="/dashboard"
                      className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-950"
                    >
                      Ir al Dashboard
                    </Link>
                  </AuthenticatedGuard>
                  
                  <UnauthenticatedGuard>
                    <LoginButton className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-950">
                      Iniciar sesión
                    </LoginButton>
                  </UnauthenticatedGuard>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
