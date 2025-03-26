'use client';

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import UserProfile from "@/components/auth/user-profile";
import LoginButton from "@/components/auth/login-button";
import { AuthenticatedGuard, UnauthenticatedGuard } from "@/components/auth/auth-guard";

export default function Header() {
  const { isLoading } = useAuth0();

  return (
    <header className="border-b sticky top-0 bg-white z-10">
      <div className="flex justify-between items-center px-4 md:px-6 mx-auto max-w-7xl h-16">
        <div className="flex items-center gap-8">
          <Link href="/">
            <Image 
              src="/logo-completo.png" 
              alt="Cucina Capitale Logo" 
              width={140} 
              height={35} 
              className="object-contain"
              priority
            />
          </Link>
          <AuthenticatedGuard>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/cotizaciones" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Cotizaciones
              </Link>
              <span className="text-sm font-medium text-gray-400 cursor-not-allowed" title="En desarrollo">
                Clientes
              </span>
              <span className="text-sm font-medium text-gray-400 cursor-not-allowed" title="En desarrollo">
                Productos
              </span>
            </nav>
            <button className="md:hidden text-gray-500 hover:text-gray-700">
              <Menu className="h-5 w-5" />
            </button>
          </AuthenticatedGuard>
        </div>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : (
            <>
              <AuthenticatedGuard>
                <UserProfile />
              </AuthenticatedGuard>
              <UnauthenticatedGuard>
                <LoginButton className="text-sm font-medium hover:underline">
                  Ingresar
                </LoginButton>
              </UnauthenticatedGuard>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
