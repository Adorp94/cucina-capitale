'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';
import { Plus, X, ChevronRight, Edit2, PenTool } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { calculateQuotationTotals, formatCurrency } from '@/lib/cotizador/calculator';
import { DEFAULT_COTIZADOR_CONFIG, generateQuotationNumber } from '@/lib/cotizador/constants';
import { CreateQuotationFormData, createQuotationSchema } from '@/types/cotizacion';

// Lista de clientes ficticia (en producción esto vendría de la base de datos)
const MOCK_CLIENTS = [
  { id: '1', name: 'Cliente Ejemplo 1', email: 'cliente1@example.com', phone: '555-1234', address: 'Calle Principal #123' },
  { id: '2', name: 'Cliente Ejemplo 2', email: 'cliente2@example.com', phone: '555-5678', address: 'Avenida Central #456' },
  { id: '3', name: 'Cliente Ejemplo 3', email: 'cliente3@example.com', phone: '555-9012', address: 'Boulevard Norte #789' },
];

// Lista de productos ficticia (en producción esto vendría de la base de datos)
const MOCK_PRODUCTS = [
  { id: '1', name: 'Mueble de Cocina Básico', basePrice: 15000, unit: 'm²' },
  { id: '2', name: 'Isla Central', basePrice: 25000, unit: 'pieza' },
  { id: '3', name: 'Instalación Básica', basePrice: 5000, unit: 'servicio' },
];

// Lista de materiales ficticia (en producción esto vendría de la base de datos)
const MOCK_MATERIALS = {
  matHuacal: ['Triplay 16mm', 'MDF 18mm', 'Melamina Blanca'],
  chapHuacal: ['PVC Blanco', 'PVC Nogal', 'ABS Natural'],
  matVista: ['Madera Maple', 'Madera Nogal', 'Laminado Blanco Mate'],
  chapVista: ['Chapa Natural', 'Chapa Chocolate', 'Laminado PVC'],
  jaladera: ['Acero Inoxidable', 'Aluminio Cepillado', 'Oculta Integrada'],
  corredera: ['Ball Bearing 18"', 'Soft-Close Full', 'Undermount Premium'],
  bisagra: ['Clip-Top 110°', 'Soft-Close 165°', 'Push-to-Open']
};

export default function CotizacionForm() {
  // Estado para los totales calculados
  const [totals, setTotals] = useState({
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
  });
  
  // Estado para gestionar el cliente seleccionado
  const [selectedClient, setSelectedClient] = useState<typeof MOCK_CLIENTS[0] | null>(null);

  // Inicializar el formulario con valores predeterminados
  const form = useForm<CreateQuotationFormData>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: {
      clientId: '',
      number: generateQuotationNumber(),
      title: 'Cotización para proyecto de carpintería',
      description: '',
      projectName: '',
      deliveryTime: '4-6 semanas',
      paymentTerms: 'Anticipo 70%, Liquidación 30%',
      paymentInfo: 'BANCO XYZ\nCuenta: 000000000000\nCLABE: 000000000000000000',
      status: 'draft',
      generalNotes: '',
      items: [{ 
        productId: '', 
        description: '', 
        quantity: 1, 
        unitPrice: 0, 
        discount: 0, 
        position: 0, 
        notes: null,
        drawers: 0,
        doors: 0,
        shelves: 0,
        area: ''
      }],
      validUntil: addDays(new Date(), DEFAULT_COTIZADOR_CONFIG.validityDays),
      terms: DEFAULT_COTIZADOR_CONFIG.defaultTerms,
      notes: '',
      materialsCombination: {
        matHuacal: '',
        chapHuacal: '',
        matVista: '',
        chapVista: '',
        jaladera: '',
        corredera: '',
        bisagra: ''
      }
    },
  });

  // Field array para manejar los ítems dinámicamente
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Actualizar datos del cliente cuando cambia la selección
  useEffect(() => {
    const clientId = form.watch('clientId');
    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    setSelectedClient(client || null);
  }, [form.watch('clientId')]);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-sm border-0 overflow-hidden bg-white">
          <CardHeader className="px-6 py-5 bg-gray-50 border-b">
            <CardTitle className="text-2xl font-light">Nueva Cotización</CardTitle>
            <CardDescription>Crea una cotización profesional para un proyecto de carpintería</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full justify-start p-0 rounded-none border-b bg-white h-12">
                <TabsTrigger 
                  value="info" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium px-6 h-full"
                >
                  Información
                </TabsTrigger>
                <TabsTrigger 
                  value="items" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium px-6 h-full"
                >
                  Productos
                </TabsTrigger>
                <TabsTrigger 
                  value="materials" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium px-6 h-full"
                >
                  Materiales
                </TabsTrigger>
                <TabsTrigger 
                  value="terms" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium px-6 h-full"
                >
                  Términos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="p-6 space-y-6">
                {/* Cliente y Proyecto */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Información del Cliente</h3>
                    
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value?.toString() || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
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
                    
                    {selectedClient && (
                      <Card className="overflow-hidden border-0 shadow-sm bg-gray-50">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{selectedClient.name}</h4>
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Edit2 size={14} className="mr-1" />
                                Editar
                              </Button>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{selectedClient.email}</p>
                              <p>{selectedClient.phone}</p>
                              <p>{selectedClient.address}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus size={16} className="mr-1" />
                      Nuevo Cliente
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Detalles del Proyecto</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="h-12 bg-gray-50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Proyecto</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} className="h-12" />
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
                          <FormLabel>Título de la Cotización</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-12" />
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
                          <FormLabel>Descripción del Proyecto</FormLabel>
                          <FormControl>
                            <Textarea 
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              disabled={field.disabled}
                              value={field.value || ''}
                              className="min-h-20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Términos de Entrega y Pago */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Términos de Entrega</h3>
                    
                    <FormField
                      control={form.control}
                      name="deliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo de Entrega</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Términos de Pago</h3>
                    
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Esquema de Pago</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="paymentInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Información para Pagos</FormLabel>
                          <FormControl>
                            <Textarea 
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              disabled={field.disabled}
                              value={field.value || ''}
                              placeholder="Datos bancarios para transferencias..."
                              className="min-h-20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Productos y Servicios */}
              <TabsContent value="items" className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Productos y Servicios</h3>
                  
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
                      notes: null,
                      drawers: 0,
                      doors: 0,
                      shelves: 0,
                      area: ''
                    })}
                    className="gap-1"
                  >
                    <Plus size={16} />
                    Agregar Producto
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="shadow-sm overflow-hidden">
                      <CardHeader className="bg-gray-50 py-3 px-4 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Producto #{index + 1}</CardTitle>
                        {fields.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 px-2 text-gray-500 hover:text-red-500"
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid md:grid-cols-12 gap-4">
                          <div className="md:col-span-7">
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
                                    value={field.value?.toString() || undefined}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-12">
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
                          
                          <div className="md:col-span-5">
                            <FormField
                              control={form.control}
                              name={`items.${index}.area`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Área / Ubicación</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      value={field.value || ''}
                                      className="h-12"
                                      placeholder="Ej. Cocina, Baño, etc."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="md:col-span-12">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descripción</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      name={field.name}
                                      ref={field.ref}
                                      disabled={field.disabled}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-12 gap-4 py-2">
                          <div className="md:col-span-3">
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
                                      className="h-12"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="md:col-span-3">
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
                                      className="h-12"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
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
                                      className="h-12"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="md:col-span-1">
                            <FormField
                              control={form.control}
                              name={`items.${index}.drawers`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cajones</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                      className="h-12"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="md:col-span-1">
                            <FormField
                              control={form.control}
                              name={`items.${index}.doors`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Puertas</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                      className="h-12"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.shelves`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Entrepaños</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                      className="h-12"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Resumen de Presupuesto */}
                <div className="bg-gray-50 rounded-lg overflow-hidden shadow-sm mt-6">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Resumen de Presupuesto</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-medium">${formatCurrency(totals.subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-gray-700">
                        <span>IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%)</span>
                        <span className="font-medium">${formatCurrency(totals.taxes)}</span>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold">${formatCurrency(totals.total)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div className="flex justify-between items-center bg-white p-3 rounded-md">
                          <span className="text-gray-600">Anticipo (70%)</span>
                          <span className="font-medium">${formatCurrency(totals.total.mul(0.7))}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-white p-3 rounded-md">
                          <span className="text-gray-600">Liquidación (30%)</span>
                          <span className="font-medium">${formatCurrency(totals.total.mul(0.3))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Materiales */}
              <TabsContent value="materials" className="p-6 space-y-6">
                <h3 className="text-lg font-medium">Materiales y Acabados</h3>
                <p className="text-gray-600 mb-4">Selecciona los materiales y acabados para la cotización</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Columna 1: Materiales Estructura */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Materiales de Estructura</h4>
                    
                    <FormField
                      control={form.control}
                      name="materialsCombination.matHuacal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material de Huacal</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_MATERIALS.matHuacal.map((material, i) => (
                                <SelectItem key={i} value={material}>
                                  {material}
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
                      name="materialsCombination.chapHuacal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chapacinta de Huacal</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar chapacinta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_MATERIALS.chapHuacal.map((material, i) => (
                                <SelectItem key={i} value={material}>
                                  {material}
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
                      name="materialsCombination.matVista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material de Vista</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_MATERIALS.matVista.map((material, i) => (
                                <SelectItem key={i} value={material}>
                                  {material}
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
                      name="materialsCombination.chapVista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chapacinta de Vista</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar chapacinta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_MATERIALS.chapVista.map((material, i) => (
                                <SelectItem key={i} value={material}>
                                  {material}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Columna 2: Herrajes y Accesorios */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Herrajes y Accesorios</h4>
                    
                    <FormField
                      control={form.control}
                      name="materialsCombination.jaladera"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jaladera</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar jaladera" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_MATERIALS.jaladera.map((material, i) => (
                                <SelectItem key={i} value={material}>
                                  {material}
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
                      name="materialsCombination.corredera"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Corredera</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar corredera" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_MATERIALS.corredera.map((material, i) => (
                                <SelectItem key={i} value={material}>
                                  {material}
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
                      name="materialsCombination.bisagra"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bisagra</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar bisagra" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_MATERIALS.bisagra.map((material, i) => (
                                <SelectItem key={i} value={material}>
                                  {material}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Vista Previa de Materiales */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Vista Previa de Especificaciones</h4>
                  
                  <Card className="shadow-sm bg-gray-50 border-0">
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm">Combinación de Materiales</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-2 divide-x divide-y">
                        <div className="p-3 border-b">
                          <p className="text-xs text-gray-500">Material Huacal</p>
                          <p className="font-medium">{form.watch("materialsCombination.matHuacal") || "No seleccionado"}</p>
                        </div>
                        <div className="p-3 border-b">
                          <p className="text-xs text-gray-500">Chapacinta Huacal</p>
                          <p className="font-medium">{form.watch("materialsCombination.chapHuacal") || "No seleccionado"}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-gray-500">Material Vista</p>
                          <p className="font-medium">{form.watch("materialsCombination.matVista") || "No seleccionado"}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-gray-500">Chapacinta Vista</p>
                          <p className="font-medium">{form.watch("materialsCombination.chapVista") || "No seleccionado"}</p>
                        </div>
                        <div className="p-3 border-t">
                          <p className="text-xs text-gray-500">Jaladera</p>
                          <p className="font-medium">{form.watch("materialsCombination.jaladera") || "No seleccionado"}</p>
                        </div>
                        <div className="p-3 border-t">
                          <p className="text-xs text-gray-500">Corredera</p>
                          <p className="font-medium">{form.watch("materialsCombination.corredera") || "No seleccionado"}</p>
                        </div>
                        <div className="p-3 border-t col-span-2">
                          <p className="text-xs text-gray-500">Bisagra</p>
                          <p className="font-medium">{form.watch("materialsCombination.bisagra") || "No seleccionado"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Términos y Condiciones */}
              <TabsContent value="terms" className="p-6 space-y-6">
                <h3 className="text-lg font-medium">Términos y Condiciones</h3>
                <p className="text-gray-600 mb-4">Especifica los términos y condiciones de la cotización</p>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Términos y Condiciones</FormLabel>
                        <FormControl>
                          <Textarea 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            disabled={field.disabled}
                            value={field.value || ''}
                            rows={6}
                            className="font-light"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="generalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones Generales</FormLabel>
                        <FormControl>
                          <Textarea 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            disabled={field.disabled}
                            value={field.value || ''}
                            rows={4}
                            className="font-light"
                          />
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
                          <Textarea 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            disabled={field.disabled}
                            value={field.value || ''}
                            rows={4}
                            className="font-light"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" className="h-12 px-6">
            Cancelar
          </Button>
          <Button type="button" variant="secondary" className="h-12 px-6">
            Guardar Borrador
          </Button>
          <Button type="submit" className="h-12 px-6 bg-black hover:bg-gray-800 gap-1">
            <PenTool size={16} />
            Crear Cotización
          </Button>
        </div>
      </form>
    </Form>
  );
}