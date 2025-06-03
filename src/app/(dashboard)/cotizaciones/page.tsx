'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Download, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/calculator";
import { useToast } from "@/components/ui/use-toast";

// Force dynamic rendering
export const dynamicParams = true;

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
  project_code: string | null;
  cliente: {
    nombre: string;
    correo: string;
    celular: string;
  };
};

export default function CotizacionesPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
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
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const downloadPdf = async (id: number) => {
    try {
      setPdfLoading(id);
      const response = await fetch(`/api/cotizacion/${id}/pdf`);
      
      if (!response.ok) {
        let errorMessage = 'Error al generar el PDF';
        try {
          const errorData = await response.json();
          console.error('PDF generation error response:', errorData);
          
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details && errorData.details.message) {
              errorMessage += `: ${errorData.details.message}`;
            }
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Create a blob from the PDF Stream
      const blob = await response.blob();
      
      // Check if the blob is valid
      if (blob.size === 0) {
        throw new Error('El PDF generado está vacío');
      }
      
      // Create a link element to download the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${id}.pdf`;
      
      // Append to the document body, click it, then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL created
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF generado correctamente",
        description: "La cotización ha sido descargada como PDF.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: error instanceof Error ? error.message : 'Ha ocurrido un error al generar el PDF.',
        variant: "destructive",
      });
    } finally {
      setPdfLoading(null);
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
                <TableHead className="py-3">Código Proyecto</TableHead>
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
                    {quotation.project_code ? (
                      <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {quotation.project_code}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin código</span>
                    )}
                  </TableCell>
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
                        size="sm" 
                        variant="outline"
                        className="shadow-sm"
                        onClick={() => downloadPdf(quotation.id_cotizacion)}
                        disabled={pdfLoading === quotation.id_cotizacion}
                      >
                        {pdfLoading === quotation.id_cotizacion ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
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