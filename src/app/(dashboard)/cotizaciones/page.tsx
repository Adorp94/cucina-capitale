import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QUOTATION_STATUSES } from '@/lib/cotizador/constants';

export const metadata: Metadata = {
  title: 'Cotizaciones | GRUPO UCMV',
  description: 'Listado de cotizaciones',
};

// Mock de datos para la vista de ejemplo
// En producción, esto vendría de la base de datos
const MOCK_QUOTATIONS = [
  {
    id: '1',
    number: 'COT-202503-001',
    title: 'Cotización para proyecto de cocina',
    clientName: 'Capital Cocinas y Equipos',
    projectName: 'Remodelación Residencial',
    total: 45000,
    createdAt: new Date('2025-03-15'),
    status: 'sent'
  },
  {
    id: '2',
    number: 'COT-202503-002',
    title: 'Cotización para vestidor',
    clientName: 'Cliente Ejemplo 2',
    projectName: 'Proyecto Vestidor',
    total: 78500,
    createdAt: new Date('2025-03-10'),
    status: 'approved'
  },
  {
    id: '3',
    number: 'COT-202503-003',
    title: 'Cotización de muebles para oficina',
    clientName: 'Cliente Ejemplo 3',
    projectName: 'Oficina Corporativa',
    total: 32800,
    createdAt: new Date('2025-03-05'),
    status: 'draft'
  },
];

export default function CotizacionesPage() {
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Cotizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus cotizaciones y da seguimiento a tus ventas.
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/cotizaciones/nueva">
            Nueva Cotización
          </Link>
        </Button>
      </div>
      
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-5 border-b bg-gray-50">
          <CardTitle>Listado de Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="py-3">No. Cotización</TableHead>
                <TableHead className="py-3">Cliente</TableHead>
                <TableHead className="py-3">Proyecto</TableHead>
                <TableHead className="py-3">Fecha</TableHead>
                <TableHead className="py-3">Total</TableHead>
                <TableHead className="py-3">Estado</TableHead>
                <TableHead className="text-right py-3">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_QUOTATIONS.map((cotizacion) => {
                const statusInfo = QUOTATION_STATUSES[cotizacion.status as keyof typeof QUOTATION_STATUSES];
                
                return (
                  <TableRow key={cotizacion.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium py-3">{cotizacion.number}</TableCell>
                    <TableCell className="py-3">{cotizacion.clientName}</TableCell>
                    <TableCell className="py-3">{cotizacion.projectName}</TableCell>
                    <TableCell className="py-3">
                      {cotizacion.createdAt.toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="py-3">
                      ${cotizacion.total.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge 
                        variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"}
                      >
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex justify-end gap-2">
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline"
                          className="shadow-sm"
                        >
                          <Link href={`/cotizaciones/${cotizacion.id}`}>
                            Ver
                          </Link>
                        </Button>
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline"
                          className="shadow-sm"
                        >
                          <Link href={`/cotizaciones/${cotizacion.id}/editar`}>
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}