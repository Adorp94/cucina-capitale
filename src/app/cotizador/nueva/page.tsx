'use client';

import CotizacionForm from '@/components/cotizador/cotizacion-form';

export default function NuevaCotizacionPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Nueva Cotización</h1>
      <CotizacionForm />
    </div>
  );
} 