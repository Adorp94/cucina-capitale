'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Package, AlertCircle } from 'lucide-react';
import { 
  generateFurnitureCode,
  parseProjectCode,
  AREAS,
  FURNITURE_TYPES,
  type FurnitureCodeConfig 
} from '@/lib/project-codes';
import { useToast } from '@/components/ui/use-toast';

const additionalOrderSchema = z.object({
  baseProjectCode: z.string().min(1, 'Código de proyecto base requerido'),
  orderType: z.enum(['A', 'G'], { required_error: 'Tipo de orden requerido' }),
  items: z.array(z.object({
    description: z.string().min(1, 'Descripción requerida'),
    area: z.string().min(1, 'Área requerida'),
    furnitureType: z.string().min(1, 'Tipo de mueble requerido'),
    quantity: z.number().int().min(1, 'Cantidad debe ser al menos 1'),
    notes: z.string().optional()
  })).min(1, 'Al menos un elemento requerido'),
  clientNotes: z.string().optional(),
  urgency: z.enum(['normal', 'high', 'urgent']).default('normal')
});

type AdditionalOrderFormValues = z.infer<typeof additionalOrderSchema>;

interface AdditionalOrderFormProps {
  baseProjectCode?: string;
  onOrderCreated?: (order: any) => void;
}

export function AdditionalOrderForm({ baseProjectCode, onOrderCreated }: AdditionalOrderFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdditionalOrderFormValues>({
    resolver: zodResolver(additionalOrderSchema),
    defaultValues: {
      baseProjectCode: baseProjectCode || '',
      orderType: 'A',
      items: [
        {
          description: '',
          area: '',
          furnitureType: '',
          quantity: 1,
          notes: ''
        }
      ],
      clientNotes: '',
      urgency: 'normal'
    }
  });

  const addItem = () => {
    const currentItems = form.getValues('items');
    form.setValue('items', [
      ...currentItems,
      {
        description: '',
        area: '',
        furnitureType: '',
        quantity: 1,
        notes: ''
      }
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues('items');
    if (currentItems.length > 1) {
      form.setValue('items', currentItems.filter((_, i) => i !== index));
    }
  };

  const generateItemCodes = (data: AdditionalOrderFormValues) => {
    try {
      const parsedCode = parseProjectCode(data.baseProjectCode);
      
      return data.items.map((item, index) => {
        const config: FurnitureCodeConfig = {
          projectType: parsedCode.typePrefix === 'RE' ? 'residencial' : 'vertical',
          verticalProject: parsedCode.typePrefix === 'WN' ? 'WN' : 
                          parsedCode.typePrefix === 'SY' ? 'SY' : undefined,
          date: new Date(parsedCode.year, parsedCode.month - 1),
          consecutiveNumber: parsedCode.consecutive,
          prototipo: parsedCode.prototipo,
          area: item.area,
          muebleType: item.furnitureType,
          productionType: data.orderType
        };

        return {
          ...item,
          code: generateFurnitureCode(config),
          index
        };
      });
    } catch (error) {
      console.error('Error generating item codes:', error);
      return [];
    }
  };

  const onSubmit = async (data: AdditionalOrderFormValues) => {
    setIsSubmitting(true);
    try {
      const itemsWithCodes = generateItemCodes(data);
      
      // Here you would typically save to database
      console.log('Creating additional order:', {
        ...data,
        items: itemsWithCodes
      });

      toast({
        title: "Orden creada exitosamente",
        description: `Se creó una orden ${data.orderType === 'A' ? 'adicional' : 'de garantía'} con ${itemsWithCodes.length} elemento(s)`,
      });

      if (onOrderCreated) {
        onOrderCreated({
          ...data,
          items: itemsWithCodes
        });
      }

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error creating additional order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden adicional",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedItems = form.watch('items');
  const watchedOrderType = form.watch('orderType');
  const watchedBaseCode = form.watch('baseProjectCode');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Orden Adicional/Garantía
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Crear Orden Adicional o de Garantía
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Base Project Code and Order Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseProjectCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Proyecto Base</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="RE-505-001 o WN-505-001-B1"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Orden</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">A</Badge>
                            Adicional (Solicitado por cliente)
                          </div>
                        </SelectItem>
                        <SelectItem value="G">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">G</Badge>
                            Garantía (Reposición por defecto)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Elementos a Producir</h3>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Elemento
                </Button>
              </div>

              <div className="space-y-4">
                {watchedItems.map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-medium">Elemento #{index + 1}</h4>
                        {watchedItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Input placeholder="Descripción del elemento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.area`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Área</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona área" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(AREAS).map(([name, code]) => (
                                    <SelectItem key={code} value={code}>
                                      {code} - {name.toLowerCase().replace(/_/g, ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.furnitureType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Mueble</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo de mueble" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(FURNITURE_TYPES).map(([name, code]) => (
                                    <SelectItem key={code} value={code}>
                                      {code} - {name.toLowerCase().replace(/_/g, ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Notas del Elemento</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Notas específicas para este elemento..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Preview Code */}
                      {watchedBaseCode && watchedItems[index]?.area && watchedItems[index]?.furnitureType && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <div className="text-sm text-gray-600 mb-1">Código generado:</div>
                          <div className="font-mono text-sm">
                            {(() => {
                              try {
                                const itemsWithCodes = generateItemCodes(form.getValues());
                                return itemsWithCodes[index]?.code || 'Error generando código';
                              } catch {
                                return 'Código base inválido';
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas del Cliente</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Comentarios del cliente o razón de la orden..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgencia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Warning for warranty orders */}
            {watchedOrderType === 'G' && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Orden de Garantía:</strong> Esta orden reemplazará elementos defectuosos 
                  del proyecto original. Asegúrate de documentar el defecto reportado.
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Orden'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 