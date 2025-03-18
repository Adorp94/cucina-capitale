import { ReactNode } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
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
            <span className="text-sm">Usuario</span>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      <footer className="border-t py-4 bg-white">
        <div className="container flex justify-between items-center">
          <p className="text-sm text-gray-500">
            © 2024 Cucina Capital. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
