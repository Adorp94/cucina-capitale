import { ReactNode } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-xl">
              Cucina Capital
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium hover:underline">
                Dashboard
              </Link>
              <Link href="/cotizaciones" className="text-sm font-medium hover:underline">
                Cotizaciones
              </Link>
              <Link href="/clientes" className="text-sm font-medium hover:underline">
                Clientes
              </Link>
              <Link href="/productos" className="text-sm font-medium hover:underline">
                Productos
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      <footer className="border-t py-6 bg-white">
        <div className="container flex justify-between items-center px-4 md:px-6">
          <p className="text-sm text-gray-500">
            © 2024 Cucina Capital. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
