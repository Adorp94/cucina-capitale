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
    <Card className="shadow-md rounded-lg overflow-hidden">
      <CardHeader className="border-b px-6 py-5 flex flex-col md:flex-row md:justify-between bg-gray-50">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{cotizacion.title}</CardTitle>
            <Badge 
              variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"}
              className="ml-2"
            >
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">No. {cotizacion.number}</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <h2 className="text-lg font-bold">GRUPO UCMV S.A. de C.V.</h2>
          <p className="text-xs text-gray-500">COTIZACIÓN</p>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 py-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-semibold py-3 bg-gray-50 border-r w-1/2">Presupuesto para:</TableCell>
                  <TableCell className="py-3">{cliente?.name || 'Cliente no especificado'}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-semibold py-3 bg-gray-50 border-r">Nombre de proyecto:</TableCell>
                  <TableCell className="py-3">{cotizacion.projectName || 'No especificado'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-semibold py-3 bg-gray-50 border-r w-1/2">Fecha de cotización:</TableCell>
                  <TableCell className="py-3">{format(new Date(cotizacion.createdAt || new Date()), 'dd-MMM-yyyy', { locale: es })}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-semibold py-3 bg-gray-50 border-r">Vigencia de cotización:</TableCell>
                  <TableCell className="py-3">
                    {cotizacion.validUntil 
                      ? format(new Date(cotizacion.validUntil), 'dd-MMM-yyyy', { locale: es })
                      : 'No especificado'
                    }
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-semibold py-3 bg-gray-50 border-r">Tipo de Proyecto:</TableCell>
                  <TableCell className="py-3">Desarrollo</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        
        {cotizacion.materialsCombination && (
          <div className="border rounded-lg overflow-hidden">
            <h3 className="text-sm font-semibold py-3 px-4 bg-gray-100 border-b">Materiales</h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center py-3">Mat Huacal</TableHead>
                  <TableHead className="text-center py-3">Chap. Huacal</TableHead>
                  <TableHead className="text-center py-3">Jaladera</TableHead>
                  <TableHead className="text-center py-3">Bisagras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="py-3">{cotizacion.materialsCombination.matHuacal}</TableCell>
                  <TableCell className="py-3">{cotizacion.materialsCombination.chapHuacal}</TableCell>
                  <TableCell className="py-3">{cotizacion.materialsCombination.jaladera}</TableCell>
                  <TableCell className="py-3">{cotizacion.materialsCombination.bisagra}</TableCell>
                </TableRow>
              </TableBody>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center py-3">Mat Vista</TableHead>
                  <TableHead className="text-center py-3">Chap. Vista</TableHead>
                  <TableHead className="text-center py-3">Corredera</TableHead>
                  <TableHead className="text-center py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="py-3">{cotizacion.materialsCombination.matVista}</TableCell>
                  <TableCell className="py-3">{cotizacion.materialsCombination.chapVista}</TableCell>
                  <TableCell className="py-3">{cotizacion.materialsCombination.corredera}</TableCell>
                  <TableCell className="py-3 font-bold text-center">Combinación #1</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="border rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold py-3 px-4 bg-gray-100 border-b">Productos y Servicios</h3>
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
                <TableHead className="text-right py-3">P. Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizacion.items.map((item, index) => (
                <TableRow key={item.id || index} className="hover:bg-gray-50">
                  <TableCell className="py-3">{item.area || '-'}</TableCell>
                  <TableCell className="py-3">{item.description}</TableCell>
                  <TableCell className="text-center py-3">{item.quantity}</TableCell>
                  <TableCell className="text-center py-3">{item.drawers || 0}</TableCell>
                  <TableCell className="text-center py-3">{item.doors || 0}</TableCell>
                  <TableCell className="text-center py-3">{item.shelves || 0}</TableCell>
                  <TableCell className="text-right py-3">${formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right py-3">${formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div></div>
            <div className="space-y-2">
              <Table>
                <TableBody>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-right py-3">Subtotal:</TableCell>
                    <TableCell className="text-right py-3 w-1/3">${formatCurrency(cotizacion.subtotal)}</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-right py-3">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%):</TableCell>
                    <TableCell className="text-right py-3">${formatCurrency(cotizacion.taxes)}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 hover:bg-gray-50">
                    <TableCell className="font-bold text-right py-3">TOTAL:</TableCell>
                    <TableCell className="text-right font-bold py-3">${formatCurrency(cotizacion.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <Table>
                <TableBody>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-right py-3">Desglose:</TableCell>
                    <TableCell className="text-right py-3 w-1/3">70 / 30</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-right py-3">Anticipo:</TableCell>
                    <TableCell className="text-right py-3">${formatCurrency(cotizacion.anticipo || 0)}</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-right py-3">Liquidación:</TableCell>
                    <TableCell className="text-right py-3">${formatCurrency(cotizacion.liquidacion || 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border p-4 rounded-md bg-blue-50">
            <h3 className="text-sm font-semibold mb-2">Para transferencia o Cheque: Grupo UCMV SA de CV:</h3>
            <p className="whitespace-pre-line">{cotizacion.paymentInfo}</p>
          </div>
          
          <div>
            <Table>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-right py-3">Tiempo de entrega:</TableCell>
                  <TableCell className="py-3">{cotizacion.deliveryTime}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-right py-3">Términos:</TableCell>
                  <TableCell className="py-3">{cotizacion.paymentTerms}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        
        {cotizacion.generalNotes && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Observaciones generales:</h3>
            <p className="text-sm whitespace-pre-line">{cotizacion.generalNotes}</p>
          </div>
        )}
        
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