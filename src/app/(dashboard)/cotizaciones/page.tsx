'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/calculator";

type Quotation = {
  id_cotizacion: number;
  created_at: string;
  id_cliente: number;
  project_name: string;
  project_type: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  taxes: number;
  total: number;
  valid_until: string | null;
  delivery_time: string | null;
  notes: string | null;
  cliente: {
    nombre: string;
    correo: string;
    celular: string;
  };
};

export default function CotizacionesPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          cliente:clientes (
            nombre,
            correo,
            celular
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

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
          <Link href="/cotizador/nueva">
            <FileText className="mr-2 h-4 w-4" />
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
                <TableHead className="py-3">ID</TableHead>
                <TableHead className="py-3">Cliente</TableHead>
                <TableHead className="py-3">Proyecto</TableHead>
                <TableHead className="py-3">Tipo</TableHead>
                <TableHead className="py-3">Fecha</TableHead>
                <TableHead className="py-3">Total</TableHead>
                <TableHead className="py-3">Estado</TableHead>
                <TableHead className="text-right py-3">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((quotation) => (
                <TableRow key={quotation.id_cotizacion} className="hover:bg-gray-50">
                  <TableCell className="font-medium py-3">{quotation.id_cotizacion}</TableCell>
                  <TableCell className="py-3">
                    <div>
                      <div className="font-medium">{quotation.cliente.nombre}</div>
                      <div className="text-sm text-gray-500">{quotation.cliente.correo}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">{quotation.project_name}</TableCell>
                  <TableCell className="py-3">{quotation.project_type}</TableCell>
                  <TableCell className="py-3">
                    {format(new Date(quotation.created_at), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell className="py-3">
                    {formatCurrency(quotation.total)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant={quotation.status === 'draft' ? "secondary" : "default"}
                    >
                      {quotation.status === 'draft' ? 'Borrador' : 'Generada'}
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
                        <Link href={`/cotizador/${quotation.id_cotizacion}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}