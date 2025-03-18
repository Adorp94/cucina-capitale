'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { calculateQuotationTotals, formatCurrency } from '@/lib/cotizador/calculator';
import { DEFAULT_COTIZADOR_CONFIG, generateQuotationNumber } from '@/lib/cotizador/constants';
import { CreateQuotationFormData, createQuotationSchema } from '@/types/cotizacion';

// Lista de clientes ficticia (en producción esto vendría de la base de datos)
const MOCK_CLIENTS = [
  { id: '1', name: 'Cliente Ejemplo 1' },
  { id: '2', name: 'Cliente Ejemplo 2' },
  { id: '3', name: 'Cliente Ejemplo 3' },
];

// Lista de productos ficticia (en producción esto vendría de la base de datos)
const MOCK_PRODUCTS = [
  { id: '1', name: 'Mueble de Cocina Básico', basePrice: 15000, unit: 'm²' },
  { id: '2', name: 'Isla Central', basePrice: 25000, unit: 'pieza' },
  { id: '3', name: 'Instalación Básica', basePrice: 5000, unit: 'servicio' },
];

export default function CotizacionForm() {
  // Estado para los totales calculados
  const [totals, setTotals] = useState({
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
  });

  // Inicializar el formulario con valores predeterminados
  const form = useForm<CreateQuotationFormData>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: {
      clientId: '',
      number: generateQuotationNumber(),
      title: 'Cotización para proyecto de cocina',
      description: '',
      status: 'draft',
      items: [{ 
        productId: '', 
        description: '', 
        quantity: 1, 
        unitPrice: 0, 
        discount: 0, 
        position: 0, 
        notes: null 
      }],
      validUntil: addDays(new Date(), DEFAULT_COTIZADOR_CONFIG.validityDays),
      terms: DEFAULT_COTIZADOR_CONFIG.defaultTerms,
      notes: '',
    },
  });

  // Field array para manejar los ítems dinámicamente
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Función para manejar la selección de producto
  const handleProductSelect = (productId: string, index: number) => {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitPrice`, product.basePrice);
    }
  };

  // Recalcular totales cuando cambien los ítems
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('items')) {
        const items = form.getValues('items');
        const { subtotal, taxes, total } = calculateQuotationTotals(
          items, 
          DEFAULT_COTIZADOR_CONFIG.taxRate
        );
        
        setTotals({
          subtotal,
          taxes,
          total,
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, form.getValues]);

  // Manejar el envío del formulario
  const onSubmit = (data: CreateQuotationFormData) => {
    const quotationWithTotals = {
      ...data,
      subtotal: totals.subtotal.toNumber(),
      taxes: totals.taxes.toNumber(),
      total: totals.total.toNumber(),
    };
    
    console.log('Cotización a guardar:', quotationWithTotals);
    // Aquí iría la lógica para guardar en Supabase/Drizzle
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Cotización</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información General</TabsTrigger>
                <TabsTrigger value="items">Productos y Servicios</TabsTrigger>
                <TabsTrigger value="terms">Términos y Condiciones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOCK_CLIENTS.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
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
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Cotización</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="items" className="space-y-4 pt-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Producto</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    handleProductSelect(value, index);
                                  }} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar producto" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MOCK_PRODUCTS.map(product => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-8">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    min="0.01" 
                                    step="0.01"
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio Unitario</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`items.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descuento (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    step="0.01"
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-3 flex items-end">
                          <Button 
                            type="button" 
                            variant="destructive"
                            className="mb-2"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length <= 1}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ 
                    productId: '', 
                    description: '', 
                    quantity: 1, 
                    unitPrice: 0, 
                    discount: 0,
                    position: fields.length,
                    notes: null
                  })}
                >
                  Agregar Producto
                </Button>
                
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%):</span>
                    <span>{formatCurrency(totals.taxes)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="terms" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Términos y Condiciones</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={8} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="button" variant="secondary">
            Guardar Borrador
          </Button>
          <Button type="submit">
            Crear Cotización
          </Button>
        </div>
      </form>
    </Form>
  );
}