'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the enhanced CotizacionForm component with no SSR
const CotizacionForm = dynamic(
  () => import('@/components/cotizador/cotizacion-form-simplified'),
  { 
    ssr: false,
    loading: () => <div className="p-6">Cargando formulario...</div> 
  }
);

// Error boundary component for handling form errors
function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error al cargar el formulario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            Ocurrió un error al cargar el formulario. Por favor, intenta de nuevo o contacta a soporte.
          </div>
          <Button asChild>
            <Link href="/cotizaciones">Volver a Cotizaciones</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error in form:", error);
    setHasError(true);
    return null;
  }
}

export default function NuevaCotizacionPage() {
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Nueva Cotización</h1>
          <p className="text-muted-foreground">
            Crea una nueva cotización para un cliente.
          </p>
        </div>
        <Button asChild variant="outline" className="shadow-sm">
          <Link href="/cotizaciones">
            Volver a Cotizaciones
          </Link>
        </Button>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-sm">
        <p>
          <strong>Versión mejorada:</strong> Esta versión del formulario incluye gestión básica de artículos y selección de materiales.
          Estamos implementando gradualmente las funcionalidades completas para asegurar estabilidad.
        </p>
      </div>
      
      <Suspense fallback={<div>Cargando formulario de cotización...</div>}>
        <FormErrorBoundary>
          <CotizacionForm />
        </FormErrorBoundary>
      </Suspense>
    </div>
  );
}