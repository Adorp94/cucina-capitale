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
      <CardHeader className="border-b flex flex-col md:flex-row md:justify-between">
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
        <div className="text-right mt-4 md:mt-0">
          <h2 className="text-lg font-bold">GRUPO UCMV S.A. de C.V.</h2>
          <p className="text-xs text-gray-500">COTIZACIÓN</p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold py-1">Presupuesto para:</TableCell>
                  <TableCell className="py-1">{cliente?.name || 'Cliente no especificado'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold py-1">Nombre de proyecto:</TableCell>
                  <TableCell className="py-1">{cotizacion.projectName || 'No especificado'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold py-1">Fecha de cotización:</TableCell>
                  <TableCell className="py-1">{format(new Date(cotizacion.createdAt || new Date()), 'dd-MMM-yyyy', { locale: es })}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold py-1">Vigencia de cotización:</TableCell>
                  <TableCell className="py-1">
                    {cotizacion.validUntil 
                      ? format(new Date(cotizacion.validUntil), 'dd-MMM-yyyy', { locale: es })
                      : 'No especificado'
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold py-1">Tipo de Proyecto:</TableCell>
                  <TableCell className="py-1">Desarrollo</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        
        {cotizacion.materialsCombination && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Materiales</h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="text-center py-1">Mat Huacal</TableHead>
                  <TableHead className="text-center py-1">Chap. Huacal</TableHead>
                  <TableHead className="text-center py-1">Jaladera</TableHead>
                  <TableHead className="text-center py-1">Bisagras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="py-1">{cotizacion.materialsCombination.matHuacal}</TableCell>
                  <TableCell className="py-1">{cotizacion.materialsCombination.chapHuacal}</TableCell>
                  <TableCell className="py-1">{cotizacion.materialsCombination.jaladera}</TableCell>
                  <TableCell className="py-1">{cotizacion.materialsCombination.bisagra}</TableCell>
                </TableRow>
              </TableBody>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="text-center py-1">Mat Vista</TableHead>
                  <TableHead className="text-center py-1">Chap. Vista</TableHead>
                  <TableHead className="text-center py-1">Corredera</TableHead>
                  <TableHead className="text-center py-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="py-1">{cotizacion.materialsCombination.matVista}</TableCell>
                  <TableCell className="py-1">{cotizacion.materialsCombination.chapVista}</TableCell>
                  <TableCell className="py-1">{cotizacion.materialsCombination.corredera}</TableCell>
                  <TableCell className="py-1 font-bold">Combinación #1</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-semibold mb-2">Productos y Servicios</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="py-1">Área</TableHead>
                <TableHead className="py-1">Mueble</TableHead>
                <TableHead className="text-center py-1">Cant.</TableHead>
                <TableHead className="text-center py-1">Cajones</TableHead>
                <TableHead className="text-center py-1">Puertas</TableHead>
                <TableHead className="text-center py-1">Entrepaños</TableHead>
                <TableHead className="text-right py-1">P. Unit</TableHead>
                <TableHead className="text-right py-1">P. Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizacion.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="py-1">{item.area || '-'}</TableCell>
                  <TableCell className="py-1">{item.description}</TableCell>
                  <TableCell className="text-center py-1">{item.quantity}</TableCell>
                  <TableCell className="text-center py-1">{item.drawers || 0}</TableCell>
                  <TableCell className="text-center py-1">{item.doors || 0}</TableCell>
                  <TableCell className="text-center py-1">{item.shelves || 0}</TableCell>
                  <TableCell className="text-right py-1">${formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right py-1">${formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div></div>
            <div className="space-y-2">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-right py-1">Subtotal:</TableCell>
                    <TableCell className="text-right py-1 w-1/3">${formatCurrency(cotizacion.subtotal)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-right py-1">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%):</TableCell>
                    <TableCell className="text-right py-1">${formatCurrency(cotizacion.taxes)}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold text-right py-1">TOTAL:</TableCell>
                    <TableCell className="text-right font-bold py-1">${formatCurrency(cotizacion.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-right py-1">Desglose:</TableCell>
                    <TableCell className="text-right py-1 w-1/3">70 / 30</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-right py-1">Anticipo:</TableCell>
                    <TableCell className="text-right py-1">${formatCurrency(cotizacion.anticipo || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-right py-1">Liquidación:</TableCell>
                    <TableCell className="text-right py-1">${formatCurrency(cotizacion.liquidacion || 0)}</TableCell>
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
                <TableRow>
                  <TableCell className="font-semibold text-right py-1">Tiempo de entrega:</TableCell>
                  <TableCell className="py-1">{cotizacion.deliveryTime}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-right py-1">Términos:</TableCell>
                  <TableCell className="py-1">{cotizacion.paymentTerms}</TableCell>
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