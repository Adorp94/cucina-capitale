'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, Printer, Mail, Check } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Encabezado de la cotización */}
      <Card className="shadow-sm border-0 overflow-hidden">
        <CardHeader className="px-6 py-5 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-light">{cotizacion.title}</CardTitle>
              <Badge 
                variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"}
                className="h-6"
              >
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">No. {cotizacion.number}</p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <h2 className="text-lg font-semibold">{DEFAULT_COTIZADOR_CONFIG.companyInfo.name}</h2>
            <p className="text-xs uppercase tracking-wide text-gray-500">Cotización</p>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
          {/* Información del cliente y proyecto */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm bg-gray-50 border-0">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Cliente</h3>
                    <p className="font-medium">{cliente?.name || 'Cliente no especificado'}</p>
                  </div>
                  
                  {cliente?.email && (
                    <div>
                      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Email</h3>
                      <p>{cliente.email}</p>
                    </div>
                  )}
                  
                  {cliente?.phone && (
                    <div>
                      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Teléfono</h3>
                      <p>{cliente.phone}</p>
                    </div>
                  )}
                  
                  {cliente?.address && (
                    <div>
                      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Dirección</h3>
                      <p>{cliente.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm bg-gray-50 border-0">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Proyecto</h3>
                    <p className="font-medium">{cotizacion.projectName || 'No especificado'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Fecha de cotización</h3>
                    <p>{format(new Date(cotizacion.createdAt || new Date()), 'dd MMMM, yyyy', { locale: es })}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Vigencia</h3>
                    <p>
                      {cotizacion.validUntil 
                        ? format(new Date(cotizacion.validUntil), 'dd MMMM, yyyy', { locale: es })
                        : 'No especificado'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tiempo de entrega</h3>
                    <p>{cotizacion.deliveryTime || 'No especificado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Materiales */}
          {cotizacion.materialsCombination && (
            <div>
              <h3 className="text-lg font-medium mb-4">Especificaciones de materiales</h3>
              <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Material Huacal</p>
                  <p className="font-medium">{cotizacion.materialsCombination.matHuacal || 'No especificado'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Chapacinta Huacal</p>
                  <p className="font-medium">{cotizacion.materialsCombination.chapHuacal || 'No especificado'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Material Vista</p>
                  <p className="font-medium">{cotizacion.materialsCombination.matVista || 'No especificado'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Chapacinta Vista</p>
                  <p className="font-medium">{cotizacion.materialsCombination.chapVista || 'No especificado'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Jaladera</p>
                  <p className="font-medium">{cotizacion.materialsCombination.jaladera || 'No especificado'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Corredera</p>
                  <p className="font-medium">{cotizacion.materialsCombination.corredera || 'No especificado'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Bisagra</p>
                  <p className="font-medium">{cotizacion.materialsCombination.bisagra || 'No especificado'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Combinación</p>
                  <p className="font-medium">Combinación #1</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Productos y Servicios */}
          <div>
            <h3 className="text-lg font-medium mb-4">Productos y servicios</h3>
            <div className="overflow-hidden rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="py-3">Área</TableHead>
                    <TableHead className="py-3">Mueble</TableHead>
                    <TableHead className="text-center py-3">Cant.</TableHead>
                    <TableHead className="text-center py-3">Cajones</TableHead>
                    <TableHead className="text-center py-3">Puertas</TableHead>
                    <TableHead className="text-center py-3">Entrepaños</TableHead>
                    <TableHead className="text-right py-3">P. Unit</TableHead>
                    <TableHead className="text-right py-3">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacion.items.map((item, index) => (
                    <TableRow key={item.id || index} className="hover:bg-gray-50">
                      <TableCell className="py-4">{item.area || '-'}</TableCell>
                      <TableCell className="py-4">{item.description}</TableCell>
                      <TableCell className="text-center py-4">{item.quantity}</TableCell>
                      <TableCell className="text-center py-4">{item.drawers || 0}</TableCell>
                      <TableCell className="text-center py-4">{item.doors || 0}</TableCell>
                      <TableCell className="text-center py-4">{item.shelves || 0}</TableCell>
                      <TableCell className="text-right py-4">${formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right py-4 font-medium">${formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="order-2 md:order-1 md:mt-8">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium mb-4">Condiciones de pago</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Esquema</p>
                        <p>{cotizacion.paymentTerms || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Anticipo (70%)</p>
                        <p className="font-medium">${formatCurrency(cotizacion.anticipo || cotizacion.total * 0.7)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Liquidación (30%)</p>
                        <p className="font-medium">${formatCurrency(cotizacion.liquidacion || cotizacion.total * 0.3)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium mb-4">Información bancaria</h4>
                    <p className="whitespace-pre-line text-sm">{cotizacion.paymentInfo}</p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 md:order-2">
                <div className="bg-gray-50 p-6 rounded-lg ml-auto md:max-w-xs">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${formatCurrency(cotizacion.subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%)</span>
                      <span className="font-medium">${formatCurrency(cotizacion.taxes)}</span>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold">${formatCurrency(cotizacion.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Términos y Condiciones */}
          <div className="space-y-6">
            {cotizacion.generalNotes && (
              <div>
                <h3 className="text-lg font-medium mb-3">Observaciones generales</h3>
                <div className="bg-gray-50 p-5 rounded-lg">
                  <p className="whitespace-pre-line text-gray-700">{cotizacion.generalNotes}</p>
                </div>
              </div>
            )}
            
            {cotizacion.terms && (
              <div>
                <h3 className="text-lg font-medium mb-3">Términos y condiciones</h3>
                <div className="bg-gray-50 p-5 rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">{cotizacion.terms}</pre>
                </div>
              </div>
            )}
            
            {cotizacion.notes && (
              <div>
                <h3 className="text-lg font-medium mb-3">Notas adicionales</h3>
                <div className="bg-gray-50 p-5 rounded-lg">
                  <p className="text-gray-700">{cotizacion.notes}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t bg-gray-50 gap-2 flex flex-wrap justify-end p-4">
          {onEdit && (
            <Button variant="outline" className="h-10 gap-1" onClick={onEdit}>
              <Pencil size={16} />
              Editar
            </Button>
          )}
          {onPrint && (
            <Button variant="outline" className="h-10 gap-1" onClick={onPrint}>
              <Printer size={16} />
              Imprimir
            </Button>
          )}
          {onSendEmail && (
            <Button variant="outline" className="h-10 gap-1" onClick={onSendEmail}>
              <Mail size={16} />
              Enviar por Email
            </Button>
          )}
          <Button className="h-10 gap-1 bg-black hover:bg-gray-800">
            <Check size={16} />
            Confirmar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}