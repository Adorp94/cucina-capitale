'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { Quotation } from '@/types/cotizacion';
import { QUOTATION_STATUSES, DEFAULT_COTIZADOR_CONFIG } from '@/lib/cotizador/constants';
import { formatCurrency } from '@/lib/cotizador/calculator';

interface ResumenCotizacionProps {
  cotizacion: Quotation;
  cliente?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    rfc?: string;
  };
  onEdit?: () => void;
  onPrint?: () => void;
  onSendEmail?: () => void;
}

export default function ResumenCotizacion({
  cotizacion,
  cliente,
  onEdit,
  onPrint,
  onSendEmail,
}: ResumenCotizacionProps) {
  const statusInfo = QUOTATION_STATUSES[cotizacion.status as keyof typeof QUOTATION_STATUSES];
  
  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{cotizacion.title}</CardTitle>
              <Badge 
                variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"}
              >
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">No. {cotizacion.number}</p>
          </div>
          <div className="text-right">
            <img 
              src={DEFAULT_COTIZADOR_CONFIG.companyInfo.logo} 
              alt="Logo" 
              className="h-14 object-contain mb-2"
            />
            <h2 className="text-lg font-bold">{DEFAULT_COTIZADOR_CONFIG.companyInfo.name}</h2>
            <p className="text-xs text-gray-500">RFC: {DEFAULT_COTIZADOR_CONFIG.companyInfo.rfc}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">Información del Cliente</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {cliente ? (
                <>
                  <p className="font-medium">{cliente.name}</p>
                  {cliente.address && <p className="text-sm text-gray-600">{cliente.address}</p>}
                  {cliente.rfc && <p className="text-sm text-gray-600">RFC: {cliente.rfc}</p>}
                  {cliente.email && <p className="text-sm text-gray-600">{cliente.email}</p>}
                  {cliente.phone && <p className="text-sm text-gray-600">{cliente.phone}</p>}
                </>
              ) : (
                <p className="text-gray-500">Cliente no especificado</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Detalles de Cotización</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Fecha de emisión:</span>
                <span>{format(new Date(cotizacion.createdAt || new Date()), 'PPP', { locale: es })}</span>
                
                <span className="text-gray-600">Válida hasta:</span>
                <span>
                  {cotizacion.validUntil 
                    ? format(new Date(cotizacion.validUntil), 'PPP', { locale: es })
                    : 'No especificado'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {cotizacion.description && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Descripción</h3>
            <p className="text-gray-700">{cotizacion.description}</p>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-semibold mb-2">Productos y Servicios</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizacion.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">
                    {item.discount > 0 ? `${item.discount}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">${formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${formatCurrency(cotizacion.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%):</span>
                <span>${formatCurrency(cotizacion.taxes)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${formatCurrency(cotizacion.total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {cotizacion.terms && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Términos y Condiciones</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-xs whitespace-pre-wrap font-sans">{cotizacion.terms}</pre>
            </div>
          </div>
        )}
        
        {cotizacion.notes && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Notas Adicionales</h3>
            <p className="text-gray-700">{cotizacion.notes}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t bg-gray-50 gap-2 flex flex-wrap justify-end">
        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            Editar
          </Button>
        )}
        {onPrint && (
          <Button variant="outline" onClick={onPrint}>
            Imprimir
          </Button>
        )}
        {onSendEmail && (
          <Button variant="secondary" onClick={onSendEmail}>
            Enviar por Email
          </Button>
        )}
        <Button>
          Confirmar
        </Button>
      </CardFooter>
    </Card>
  );
}