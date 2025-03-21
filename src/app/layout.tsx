import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import Image from "next/image";
import Link from "next/link";

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
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex justify-between items-center px-4 md:px-6 mx-auto max-w-7xl h-16 border-b">
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
          </header>
          <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {children}
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
