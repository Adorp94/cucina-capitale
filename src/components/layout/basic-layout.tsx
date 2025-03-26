'use client';

import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";
import Link from "next/link";

export default function BasicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
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
    </>
  );
} 