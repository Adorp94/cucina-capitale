import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-day-picker/dist/style.css";
import { Toaster } from "@/components/ui/toaster";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cucina Capitale",
  description: "Sistema de gestión para carpintería residencial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
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
                <SignedIn>
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
                </SignedIn>
              </div>
              <div className="flex items-center gap-4">
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Link href="/register" className="text-sm font-medium hover:underline">
                    Ingresar
                  </Link>
                </SignedOut>
              </div>
            </div>
          </header>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <footer className="border-t py-3">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <p className="text-xs text-gray-400 text-center">
                © 2025 Cucina Capitale
              </p>
            </div>
          </footer>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
