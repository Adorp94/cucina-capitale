import { Metadata } from 'next';
import CotizacionForm from '@/components/cotizador/cotizacion-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Nueva Cotización | Cucina Capital',
  description: 'Crear una nueva cotización para un cliente',
};

export default function NuevaCotizacionPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nueva Cotización</h1>
        <p className="text-muted-foreground">
          Crea una nueva cotización para un cliente.
        </p>
      </div>
      
      <CotizacionForm />
    </div>
  );
}