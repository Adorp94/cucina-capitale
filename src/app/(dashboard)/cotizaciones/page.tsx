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
    <div className="container py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus cotizaciones y da seguimiento a tus ventas.
          </p>
        </div>
        <Button asChild>
          <Link href="/cotizaciones/nueva">
            Nueva Cotización
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_QUOTATIONS.map((cotizacion) => {
                const statusInfo = QUOTATION_STATUSES[cotizacion.status as keyof typeof QUOTATION_STATUSES];
                
                return (
                  <TableRow key={cotizacion.id}>
                    <TableCell className="font-medium">{cotizacion.number}</TableCell>
                    <TableCell>{cotizacion.clientName}</TableCell>
                    <TableCell>{cotizacion.projectName}</TableCell>
                    <TableCell>
                      {cotizacion.createdAt.toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      ${cotizacion.total.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"}
                      >
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline"
                        >
                          <Link href={`/cotizaciones/${cotizacion.id}`}>
                            Ver
                          </Link>
                        </Button>
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline"
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