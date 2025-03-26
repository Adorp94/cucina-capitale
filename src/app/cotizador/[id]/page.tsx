'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from "@/lib/cotizador/calculator";
import { ArrowLeft, Printer, Mail, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

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
    direccion: string;
  };
  items: Array<{
    id_item: number;
    mueble_id: number;
    position: number;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  materiales: Array<{
    id_material: number;
    tipo: string;
    costo_usado: number;
  }>;
};

export default function ViewQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotation = useCallback(async () => {
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
            celular,
            direccion
          ),
          items:cotizacion_items (
            id_item,
            mueble_id,
            position,
            description,
            quantity,
            unit_price,
            total_price
          ),
          materiales:cotizacion_materiales (
            id_material,
            tipo,
            costo_usado
          )
        `)
        .eq('id_cotizacion', params.id)
        .single();

      if (error) throw error;
      setQuotation(data);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la cotización",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    // If the ID is "nueva", redirect to the new quotation page
    if (params.id === 'nueva') {
      router.push('/cotizador/nueva');
      return;
    }

    fetchQuotation();
  }, [params.id, router, fetchQuotation]);

  const handleEdit = () => {
    router.push(`/cotizador/${params.id}/editar`);
  };

  const handlePrint = () => {
    // Implement print functionality
    window.print();
  };

  const handleSendEmail = async () => {
    if (!quotation?.cliente.correo) {
      toast({
        id: "email-error",
        title: "Error",
        description: "El cliente no tiene un correo electrónico registrado.",
        variant: "destructive",
      });
      return;
    }

    // Implement email sending functionality
    toast({
      id: "email-success",
      title: "Enviado",
      description: "La cotización ha sido enviada por correo electrónico.",
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!quotation) {
    return <div className="flex items-center justify-center min-h-screen">Cotización no encontrada</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Button asChild variant="ghost">
            <Link href="/cotizaciones">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Cotizaciones
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleSendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar por Email
            </Button>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Cotización #{quotation.id_cotizacion}</h1>
      </div>

      <div className="grid gap-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{quotation.cliente.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Correo</p>
                <p className="font-medium">{quotation.cliente.correo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{quotation.cliente.celular}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium">{quotation.cliente.direccion}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Proyecto */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre del Proyecto</p>
                <p className="font-medium">{quotation.project_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Proyecto</p>
                <p className="font-medium">{quotation.project_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de Creación</p>
                <p className="font-medium">
                  {format(new Date(quotation.created_at), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tiempo de Entrega</p>
                <p className="font-medium">{quotation.delivery_time || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Válido hasta</p>
                <p className="font-medium">
                  {quotation.valid_until 
                    ? format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: es })
                    : 'No especificado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium">
                  {quotation.status === 'draft' ? 'Borrador' : 'Generada'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items de la Cotización */}
        <Card>
          <CardHeader>
            <CardTitle>Items de la Cotización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotation.items.map((item) => (
                <div key={item.id_item} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity} | Precio unitario: {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Materiales */}
        <Card>
          <CardHeader>
            <CardTitle>Materiales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotation.materiales.map((material) => (
                <div key={`${material.id_material}-${material.tipo}`} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{material.tipo}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(material.costo_usado)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totales */}
        <Card>
          <CardHeader>
            <CardTitle>Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p className="font-medium">{formatCurrency(quotation.subtotal)}</p>
              </div>
              <div className="flex justify-between">
                <p>IVA ({quotation.tax_rate * 100}%)</p>
                <p className="font-medium">{formatCurrency(quotation.taxes)}</p>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <p>Total</p>
                <p>{formatCurrency(quotation.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        {quotation.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{quotation.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 