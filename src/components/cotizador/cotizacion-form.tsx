'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';
import { Plus, X, ChevronRight, Edit2, PenTool, Trash2, ChevronDown, ChevronUp, CalendarIcon } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { calculateQuotationTotals } from '@/lib/cotizador/calculator';
import { formatCurrency as formatCurrencyUtil } from '@/lib/cotizador/calculator';
import { DEFAULT_COTIZADOR_CONFIG, generateQuotationNumber } from '@/lib/cotizador/constants';
import { CreateQuotationFormData, createQuotationSchema } from '@/types/cotizacion';

// Mock data for testing - replace with API calls in production
const MOCK_CLIENTS = [
  { id: "1", name: "Cliente Ejemplo 1", email: "cliente1@example.com", phone: "123-456-7890", address: "Dirección Ejemplo 1" },
  { id: "2", name: "Cliente Ejemplo 2", email: "cliente2@example.com", phone: "098-765-4321", address: "Dirección Ejemplo 2" },
  { id: "3", name: "Cliente Ejemplo 3", email: "cliente3@example.com", phone: "555-555-5555", address: "Dirección Ejemplo 3" },
];

const MOCK_PRODUCTS = [
  { name: "Alacena", description: "Alacena de cocina básica", price: 5000 },
  { name: "Gabinete Base", description: "Gabinete base para cocina", price: 3500 },
  { name: "Isla", description: "Isla de cocina con superficie de trabajo", price: 7500 },
  { name: "Despensero", description: "Mueble despensero para almacenamiento", price: 6000 },
];

// Updated mock materials data to match Supabase schema
// Based on the schema: id_material, tipo, nombre, costo, categoria, comentario
const MOCK_MATERIALS = {
  matHuacal: [
    { id_material: 1, tipo: "Huacal", nombre: "MDF", costo: 120, categoria: "Estructura", comentario: "Material estándar" },
    { id_material: 2, tipo: "Huacal", nombre: "Melamina", costo: 100, categoria: "Estructura", comentario: "Material económico" },
    { id_material: 3, tipo: "Huacal", nombre: "Aglomerado", costo: 80, categoria: "Estructura", comentario: "Material básico" },
  ],
  chapHuacal: [
    { id_material: 4, tipo: "Chapacinta", nombre: "PVC", costo: 50, categoria: "Huacal", comentario: "Acabado estándar" },
    { id_material: 5, tipo: "Chapacinta", nombre: "Melamina", costo: 40, categoria: "Huacal", comentario: "Acabado económico" },
    { id_material: 6, tipo: "Chapacinta", nombre: "Chapa Natural", costo: 90, categoria: "Huacal", comentario: "Acabado premium" },
  ],
  matVista: [
    { id_material: 7, tipo: "Vista", nombre: "MDF", costo: 150, categoria: "Estructura", comentario: "Material calidad vista" },
    { id_material: 8, tipo: "Vista", nombre: "Madera Sólida", costo: 300, categoria: "Estructura", comentario: "Material premium" },
    { id_material: 9, tipo: "Vista", nombre: "Melamina Premium", costo: 180, categoria: "Estructura", comentario: "Calidad intermedia" },
  ],
  chapVista: [
    { id_material: 10, tipo: "Chapacinta", nombre: "PVC Premium", costo: 70, categoria: "Vista", comentario: "Acabado calidad" },
    { id_material: 11, tipo: "Chapacinta", nombre: "Chapa Natural", costo: 120, categoria: "Vista", comentario: "Acabado premium" },
    { id_material: 12, tipo: "Chapacinta", nombre: "Laminado", costo: 80, categoria: "Vista", comentario: "Acabado estándar" },
  ],
  jaladera: [
    { id_material: 13, tipo: "Herraje", nombre: "Acero Inoxidable", costo: 150, categoria: "Jaladera", comentario: "Calidad comercial" },
    { id_material: 14, tipo: "Herraje", nombre: "Aluminio", costo: 120, categoria: "Jaladera", comentario: "Calidad estándar" },
    { id_material: 15, tipo: "Herraje", nombre: "Oculta", costo: 250, categoria: "Jaladera", comentario: "Diseño minimalista" },
  ],
  corredera: [
    { id_material: 16, tipo: "Herraje", nombre: "Básica", costo: 80, categoria: "Corredera", comentario: "Uso general" },
    { id_material: 17, tipo: "Herraje", nombre: "Cierre Suave", costo: 150, categoria: "Corredera", comentario: "Sistema amortiguado" },
    { id_material: 18, tipo: "Herraje", nombre: "Push-Open", costo: 180, categoria: "Corredera", comentario: "Sistema automático" },
  ],
  bisagra: [
    { id_material: 19, tipo: "Herraje", nombre: "Estándar", costo: 60, categoria: "Bisagra", comentario: "Uso general" },
    { id_material: 20, tipo: "Herraje", nombre: "Cierre Suave", costo: 120, categoria: "Bisagra", comentario: "Sistema amortiguado" },
    { id_material: 21, tipo: "Herraje", nombre: "Push-Open", costo: 150, categoria: "Bisagra", comentario: "Sistema automático" },
  ],
};

// Rename local formatting function to avoid conflicts
const formatCurrencyDisplay = (amount: Decimal) => {
  return `$${amount.toFixed(2)}`;
};

// Form schema using zod
const cotizacionFormSchema = z.object({
  // Client Information
  clientId: z.string().optional(),
  clientName: z.string().min(1, { message: "Nombre del cliente requerido" }),
  clientEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  
  // Project Information
  projectName: z.string().min(1, { message: "Nombre del proyecto requerido" }),
  cotizacionDate: z.date(),
  validUntil: z.date(),
  
  // Delivery and Payment
  deliveryTime: z.number().min(1, { message: "Tiempo de entrega requerido" }),
  paymentTerms: z.string().min(1, { message: "Condiciones de pago requeridas" }),
  
  // Materials
  materialsCombination: z.object({
    matHuacal: z.string().optional(),
    chapHuacal: z.string().optional(),
    matVista: z.string().optional(),
    chapVista: z.string().optional(),
    jaladera: z.string().optional(),
    corredera: z.string().optional(),
    bisagra: z.string().optional(),
  }),
  
  // Products and Items
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, { message: "Nombre del producto requerido" }),
      description: z.string().optional(),
      quantity: z.number().min(0.01, { message: "Cantidad debe ser mayor a 0" }),
      unitPrice: z.number().min(0, { message: "Precio unitario debe ser mayor o igual a 0" }),
      discount: z.number().min(0).max(100).optional(),
      doors: z.number().min(0).optional(),
      drawers: z.number().min(0).optional(),
      shelves: z.number().min(0).optional(),
    })
  ).min(1, { message: "Agregue al menos un producto" }),
  
  // Terms and Notes
  terms: z.string().optional(),
  generalNotes: z.string().optional(),
  notes: z.string().optional(),
});

export default function CotizacionForm() {
  // Default values for the form
  const defaultValues = {
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    projectName: "",
    cotizacionDate: new Date(),
    validUntil: addDays(new Date(), 15),
    deliveryTime: 20,
    paymentTerms: "70-30",
    materialsCombination: {
      matHuacal: "",
      chapHuacal: "",
      matVista: "",
      chapVista: "",
      jaladera: "",
      corredera: "",
      bisagra: "",
    },
    items: [] as any[],
    terms: "Los precios pueden variar según condiciones del mercado. La cotización no incluye instalación a menos que se especifique.",
    generalNotes: "",
    notes: "",
  };
  
  const [totals, setTotals] = useState({
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
  });
  
  const form = useForm<z.infer<typeof cotizacionFormSchema>>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues,
  });
  
  // Get items from form for easier access
  const items = form.watch("items") || [];
  
  // Calculate totals when items change
  useEffect(() => {
    const calculateTotals = () => {
      let subtotal = new Decimal(0);
      
      items.forEach(item => {
        const quantity = new Decimal(item.quantity || 0);
        const unitPrice = new Decimal(item.unitPrice || 0);
        const discount = new Decimal(item.discount || 0).div(100);
        
        const itemTotal = quantity.mul(unitPrice).mul(new Decimal(1).minus(discount));
        subtotal = subtotal.plus(itemTotal);
      });
      
      const taxRate = new Decimal(DEFAULT_COTIZADOR_CONFIG.taxRate).div(100);
      const taxes = subtotal.mul(taxRate);
      const total = subtotal.plus(taxes);
      
      setTotals({
        subtotal,
        taxes,
        total,
      });
    };
    
    calculateTotals();
  }, [items]);
  
  // Form submission handler
  const onSubmit = (data: z.infer<typeof cotizacionFormSchema>) => {
    console.log("Form submitted:", data);
    // Here you would typically send the data to your API
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle>Nueva Cotización</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Section 1: Client Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Información del Cliente</h3>
                <div className="text-sm text-gray-500">Sección 1 de 5</div>
              </div>
              <Separator />
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Client Selection Column */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            
                            // Populate client data when a client is selected
                            const selectedClient = MOCK_CLIENTS.find(client => client.id === value);
                            if (selectedClient) {
                              form.setValue("clientName", selectedClient.name);
                              form.setValue("clientEmail", selectedClient.email);
                              form.setValue("clientPhone", selectedClient.phone);
                              form.setValue("clientAddress", selectedClient.address);
                            }
                          }} 
                          value={field.value || undefined}
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
                  
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Project Information Column */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Proyecto</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Textarea 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            disabled={field.disabled}
                            value={field.value || ''}
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cotizacionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Cotización</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "h-12 w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date: Date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                  name={"paymentInfo" as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Información de Pago</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información para realizar el pago"
                          className="resize-none"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Section 2: Materials */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Materiales y Acabados</h3>
                <div className="text-sm text-gray-500">Sección 2 de 5</div>
              </div>
              <Separator />
              
              <Accordion type="single" collapsible defaultValue="materials" className="w-full">
                <AccordionItem value="materials" className="border-0">
                  <AccordionTrigger className="py-3 text-base font-medium">
                    Selección de Materiales
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-6 pt-2">
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
                                  {MOCK_MATERIALS.matHuacal.map((material) => (
                                    <SelectItem key={material.id_material} value={material.nombre}>
                                      {material.nombre} - ${formatCurrencyDisplay(new Decimal(material.costo))}
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
                                  {MOCK_MATERIALS.chapHuacal.map((material) => (
                                    <SelectItem key={material.id_material} value={material.nombre}>
                                      {material.nombre} - ${formatCurrencyDisplay(new Decimal(material.costo))}
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
                                  {MOCK_MATERIALS.matVista.map((material) => (
                                    <SelectItem key={material.id_material} value={material.nombre}>
                                      {material.nombre} - ${formatCurrencyDisplay(new Decimal(material.costo))}
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
                                  {MOCK_MATERIALS.chapVista.map((material) => (
                                    <SelectItem key={material.id_material} value={material.nombre}>
                                      {material.nombre} - ${formatCurrencyDisplay(new Decimal(material.costo))}
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
                                  {MOCK_MATERIALS.jaladera.map((material) => (
                                    <SelectItem key={material.id_material} value={material.nombre}>
                                      {material.nombre} - ${formatCurrencyDisplay(new Decimal(material.costo))}
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
                                  {MOCK_MATERIALS.corredera.map((material) => (
                                    <SelectItem key={material.id_material} value={material.nombre}>
                                      {material.nombre} - ${formatCurrencyDisplay(new Decimal(material.costo))}
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
                                  {MOCK_MATERIALS.bisagra.map((material) => (
                                    <SelectItem key={material.id_material} value={material.nombre}>
                                      {material.nombre} - ${formatCurrencyDisplay(new Decimal(material.costo))}
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            {/* Section 3: Products and Items */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Productos y Servicios</h3>
                <div className="text-sm text-gray-500">Sección 3 de 5</div>
              </div>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">Lista de Productos</h4>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const items = form.getValues("items") || [];
                      form.setValue("items", [
                        ...items,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          description: "",
                          quantity: 1,
                          unitPrice: 0,
                          discount: 0,
                          doors: 0,
                          drawers: 0,
                          shelves: 0,
                        }
                      ]);
                    }}
                    className="h-9 gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Producto
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Table Headers for Products */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 py-2 px-4 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                    <div className="md:col-span-4">Producto / Servicio</div>
                    <div className="md:col-span-3">Cantidad</div>
                    <div className="md:col-span-3">Precio</div>
                    <div className="md:col-span-2">Acciones</div>
                  </div>
                  
                  {items.map((item, index) => (
                    <Card key={item.id} className="shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4 border-b bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium text-gray-900">
                              {form.watch(`items.${index}.name`) || `Producto ${index + 1}`}
                            </h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentItems = form.getValues("items");
                                form.setValue(
                                  "items",
                                  currentItems.filter((_, i) => i !== index)
                                );
                              }}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          <div className="grid md:grid-cols-12 gap-4">
                            <div className="md:col-span-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Producto / Servicio</FormLabel>
                                    <Select 
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        
                                        // Auto-populate product details when selected
                                        const selectedProduct = MOCK_PRODUCTS.find(product => product.name === value);
                                        if (selectedProduct) {
                                          form.setValue(`items.${index}.description`, selectedProduct.description);
                                          form.setValue(`items.${index}.unitPrice`, selectedProduct.price);
                                        }
                                      }} 
                                      value={field.value || undefined}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-12">
                                          <SelectValue placeholder="Seleccionar producto" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {MOCK_PRODUCTS.map((product, i) => (
                                          <SelectItem key={i} value={product.name}>
                                            {product.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="mt-3">
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
                            
                            <div className="md:col-span-8">
                              <div className="grid md:grid-cols-12 gap-4 h-full">
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
                                
                                <div className="md:col-span-3">
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
                                
                                <div className="md:col-span-3">
                                  <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="specs" className="border-0">
                                      <AccordionTrigger className="py-3 px-0 text-sm">
                                        Especificaciones Adicionales
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="grid grid-cols-3 gap-2">
                                          <FormField
                                            control={form.control}
                                            name={`items.${index}.drawers`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-xs">Cajones</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    {...field} 
                                                    type="number" 
                                                    min="0" 
                                                    step="1"
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                                    className="h-8 text-sm"
                                                  />
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={form.control}
                                            name={`items.${index}.doors`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-xs">Puertas</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    {...field} 
                                                    type="number" 
                                                    min="0" 
                                                    step="1"
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                                    className="h-8 text-sm"
                                                  />
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={form.control}
                                            name={`items.${index}.shelves`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-xs">Entrepaños</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    {...field} 
                                                    type="number" 
                                                    min="0" 
                                                    step="1"
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                                    className="h-8 text-sm"
                                                  />
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                      <p className="text-gray-500 mb-3">No hay productos agregados</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("items", [
                            {
                              id: crypto.randomUUID(),
                              name: "",
                              description: "",
                              quantity: 1,
                              unitPrice: 0,
                              discount: 0,
                              doors: 0,
                              drawers: 0,
                              shelves: 0,
                            }
                          ]);
                        }}
                        className="h-9 gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Producto
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Section 4: Pricing and Payment Terms */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Condiciones de Pago y Entrega</h3>
                <div className="text-sm text-gray-500">Sección 4 de 5</div>
              </div>
              <Separator />
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condiciones de Pago</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Seleccionar condiciones" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="70-30">70% anticipo - 30% entrega</SelectItem>
                            <SelectItem value="50-50">50% anticipo - 50% entrega</SelectItem>
                            <SelectItem value="100">100% anticipo</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deliveryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo de Entrega (días hábiles)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            step="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Válido Hasta</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "h-12 w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date: Date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Resumen de Presupuesto */}
                <div className="rounded-lg overflow-hidden shadow-sm border bg-white sticky top-4">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Resumen de Presupuesto</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-medium">${formatCurrencyDisplay(totals.subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-gray-700">
                        <span>IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%)</span>
                        <span className="font-medium">${formatCurrencyDisplay(totals.taxes)}</span>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold">${formatCurrencyDisplay(totals.total)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                          <span className="text-gray-600">Anticipo (70%)</span>
                          <span className="font-medium">${formatCurrencyDisplay(totals.total.mul(0.7))}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                          <span className="text-gray-600">Liquidación (30%)</span>
                          <span className="font-medium">${formatCurrencyDisplay(totals.total.mul(0.3))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 5: Terms and Conditions */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Términos y Condiciones</h3>
                <div className="text-sm text-gray-500">Sección 5 de 5</div>
              </div>
              <Separator />
              
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
            </div>
          </CardContent>
        </Card>
        
        {/* Progress Indicator */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-2 z-10">
          <div className="container mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-64 bg-gray-200 rounded-full h-2.5">
                <div className="bg-black h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <span className="text-sm text-gray-600">3 de 5 secciones completadas</span>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="h-10 px-4">
                Cancelar
              </Button>
              <Button type="button" variant="secondary" className="h-10 px-4">
                Guardar Borrador
              </Button>
              <Button type="submit" className="h-10 px-4 bg-black hover:bg-gray-800 gap-1">
                <PenTool size={16} />
                Crear Cotización
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}