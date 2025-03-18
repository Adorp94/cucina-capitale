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
    <div className="container py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Cotización</h1>
          <p className="text-muted-foreground">
            Crea una nueva cotización para un cliente.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/cotizaciones">
            Volver a Cotizaciones
          </Link>
        </Button>
      </div>
      
      <CotizacionForm />
    </div>
  );
}