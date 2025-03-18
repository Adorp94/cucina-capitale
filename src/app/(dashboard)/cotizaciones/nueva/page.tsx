import { Metadata } from 'next';
import Link from 'next/link';
import CotizacionForm from '@/components/cotizador/cotizacion-form';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Nueva Cotización | GRUPO UCMV',
  description: 'Crear una nueva cotización para un cliente',
};

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
      
      <CotizacionForm />
    </div>
  );
}