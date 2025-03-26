'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function ClientesPage() {
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Administra la información de tus clientes.
          </p>
        </div>
        <Button asChild variant="outline" className="shadow-sm">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Link>
        </Button>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="px-6 py-5 border-b bg-gray-50">
          <CardTitle>Página en Construcción</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-10">
            <h2 className="text-xl font-semibold mb-4">Esta sección se encuentra en desarrollo</h2>
            <p className="text-center text-gray-600 max-w-md mb-6">
              La gestión de clientes estará disponible próximamente. Estamos trabajando para ofrecerte la mejor experiencia.
            </p>
            <Button asChild>
              <Link href="/dashboard">
                Volver al Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 