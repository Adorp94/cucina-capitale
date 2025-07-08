'use client';

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from 'react';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show auth-dependent content until mounted and Clerk is loaded
  const shouldShow = mounted && isLoaded;

  return (
    <header className="border-b sticky top-0 bg-white z-10">
      <div className="flex justify-between items-center px-4 md:px-6 mx-auto max-w-7xl h-16">
        <div className="flex items-center gap-8">
          <Link href={shouldShow && isSignedIn ? "/dashboard" : "/"}>
            <Image 
              src="/logo-completo.png" 
              alt="Cucina Capitale Logo" 
              width={140} 
              height={35} 
              className="object-contain"
              priority
            />
          </Link>
          {shouldShow && isSignedIn && (
            <>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <Link href="/cotizaciones" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Cotizaciones
                </Link>
                <Link href="/datos" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Datos
                </Link>
                <span className="text-sm font-medium text-gray-400 cursor-not-allowed" title="En desarrollo">
                  Clientes
                </span>
                <span className="text-sm font-medium text-gray-400 cursor-not-allowed" title="En desarrollo">
                  Productos
                </span>
              </nav>
              <button 
                className="md:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!shouldShow ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : (
            <>
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              ) : (
                <SignInButton mode="modal">
                  <button className="text-sm font-medium hover:underline">
                    Ingresar
                  </button>
                </SignInButton>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {shouldShow && isSignedIn && mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="px-4 py-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/cotizaciones" 
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cotizaciones
            </Link>
            <Link 
              href="/datos" 
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Datos
            </Link>
            <span className="block text-sm font-medium text-gray-400 cursor-not-allowed py-2" title="En desarrollo">
              Clientes
            </span>
            <span className="block text-sm font-medium text-gray-400 cursor-not-allowed py-2" title="En desarrollo">
              Productos
            </span>
          </nav>
        </div>
      )}
    </header>
  );
}
