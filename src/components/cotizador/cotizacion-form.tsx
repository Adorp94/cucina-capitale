'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';
import { 
  Plus, X, ChevronRight, Edit2, PenTool, Trash2, 
  ChevronDown, ChevronUp, CalendarIcon, ArrowUp, Check, Loader2 
} from 'lucide-react';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/components/ui/use-toast";

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
import { Label } from "@/components/ui/label";

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
    { id_material: 1, tipo: "Tableros", nombre: "MDF", costo: 120, categoria: "Estructura", comentario: "Material estándar" },
    { id_material: 2, tipo: "Tableros", nombre: "Melamina", costo: 100, categoria: "Estructura", comentario: "Material económico" },
    { id_material: 3, tipo: "Tableros", nombre: "Aglomerado", costo: 80, categoria: "Estructura", comentario: "Material básico" },
  ],
  chapHuacal: [
    { id_material: 4, tipo: "Chapacinta", nombre: "PVC", costo: 50, categoria: "Huacal", comentario: "Acabado estándar" },
    { id_material: 5, tipo: "Chapacinta", nombre: "Melamina", costo: 40, categoria: "Huacal", comentario: "Acabado económico" },
    { id_material: 6, tipo: "Chapacinta", nombre: "Chapa Natural", costo: 90, categoria: "Huacal", comentario: "Acabado premium" },
  ],
  matVista: [
    { id_material: 7, tipo: "Tableros", nombre: "MDF", costo: 150, categoria: "Estructura", comentario: "Material calidad vista" },
    { id_material: 8, tipo: "Tableros", nombre: "Madera Sólida", costo: 300, categoria: "Estructura", comentario: "Material premium" },
    { id_material: 9, tipo: "Tableros", nombre: "Melamina Premium", costo: 180, categoria: "Estructura", comentario: "Calidad intermedia" },
  ],
  chapVista: [
    { id_material: 10, tipo: "Chapacinta", nombre: "PVC Premium", costo: 70, categoria: "Vista", comentario: "Acabado calidad" },
    { id_material: 11, tipo: "Chapacinta", nombre: "Chapa Natural", costo: 120, categoria: "Vista", comentario: "Acabado premium" },
    { id_material: 12, tipo: "Chapacinta", nombre: "Laminado", costo: 80, categoria: "Vista", comentario: "Acabado estándar" },
  ],
  jaladera: [
    { id_material: 13, tipo: "Jaladera", nombre: "Acero Inoxidable", costo: 150, categoria: "Jaladera", comentario: "Calidad comercial" },
    { id_material: 14, tipo: "Jaladera", nombre: "Aluminio", costo: 120, categoria: "Jaladera", comentario: "Calidad estándar" },
    { id_material: 15, tipo: "Jaladera", nombre: "Oculta", costo: 250, categoria: "Jaladera", comentario: "Diseño minimalista" },
  ],
  corredera: [
    { id_material: 16, tipo: "Corredera", nombre: "Básica", costo: 80, categoria: "Corredera", comentario: "Uso general" },
    { id_material: 17, tipo: "Corredera", nombre: "Cierre Suave", costo: 150, categoria: "Corredera", comentario: "Sistema amortiguado" },
    { id_material: 18, tipo: "Corredera", nombre: "Push-Open", costo: 180, categoria: "Corredera", comentario: "Sistema automático" },
  ],
  bisagra: [
    { id_material: 19, tipo: "Bisagras", nombre: "Estándar", costo: 60, categoria: "Bisagra", comentario: "Uso general" },
    { id_material: 20, tipo: "Bisagras", nombre: "Cierre Suave", costo: 120, categoria: "Bisagra", comentario: "Sistema amortiguado" },
    { id_material: 21, tipo: "Bisagras", nombre: "Push-Open", costo: 150, categoria: "Bisagra", comentario: "Sistema automático" },
  ],
};

const VENDEDORES = [
  { id: "1", name: "Capital Cocinas" },
  { id: "2", name: "GRUPO UCMV GDL" },
  { id: "3", name: "GRUPO UCMV Cabos" },
];

const FABRICANTES = [
  { id: "1", name: "GRUPO UCMV" },
  { id: "2", name: "Otros" },
];

const INSTALADORES = [
  { id: "1", name: "Capital Cocinas" },
  { id: "2", name: "GRUPO UCMV GDL" },
  { id: "3", name: "Otros" },
];

const TIPOS_PROYECTO = [
  { id: "1", name: "Residencial" },
  { id: "2", name: "Comercial" },
  { id: "3", name: "Desarrollo" },
  { id: "4", name: "Institucional" },
];

// Rename local formatting function to avoid conflicts
const formatCurrencyDisplay = (amount: Decimal) => {
  return `$${amount.toFixed(2)}`;
};

// New Client modal component
function NuevoClienteModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: { id: string; nombre: string; correo?: string; celular?: string; direccion?: string }) => void;
}) {
  const { toast, error: toastError, success: toastSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form for the new client with updated schema for celular as text
  const clientForm = useForm({
    defaultValues: {
      nombre: "",
      correo: "",
      celular: "",
      direccion: "",
    },
    resolver: zodResolver(
      z.object({
        nombre: z.string().min(1, "El nombre es obligatorio"),
        correo: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
        celular: z.string().optional(),
        direccion: z.string().optional(),
      })
    ),
  });
  
  // Handle form submission
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Create a Supabase client
      const supabase = createClientComponentClient();
      
      // Insert directly without authentication check since we have public insert policy
      const { data: newClient, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: data.nombre,
          correo: data.correo || null,
          celular: data.celular || null,
          direccion: data.direccion || null
        }])
        .select()
        .single();
        
      if (error) {
        console.error("Error al guardar el cliente:", error);
        toastError("Error al guardar el cliente: " + error.message);
        return;
      }
      
      console.log("Cliente creado:", newClient);
      toastSuccess(`El cliente "${data.nombre}" ha sido creado exitosamente`);
      
      onSave({
        id: newClient.id_cliente,
        nombre: data.nombre,
        correo: data.correo || undefined,
        celular: data.celular || undefined,
        direccion: data.direccion || undefined
      });
      
      clientForm.reset();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toastError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If the modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Nuevo Cliente</h2>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={clientForm.control}
                name="correo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={clientForm.control}
                name="celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        {...field}
                        className="h-11" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={clientForm.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        className="min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cliente"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

// Form schema using zod
const cotizacionFormSchema = z.object({
  // Team Information
  vendedor: z.string().min(1, { message: "Vendedor requerido" }),
  fabricante: z.string().min(1, { message: "Fabricante requerido" }),
  instalador: z.string().min(1, { message: "Instalador requerido" }),

  // Client Information
  clientId: z.string().optional(),
  clientName: z.string().min(1, { message: "Nombre del cliente requerido" }),
  clientEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  
  // Project Information
  projectName: z.string().min(1, { message: "Nombre del proyecto requerido" }),
  projectType: z.string().min(1, { message: "Tipo de proyecto requerido" }),
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
      area: z.string().optional(),
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
  const { toast, error: toastError, success: toastSuccess } = useToast();
  const [clients, setClients] = useState<Array<{id: string; name: string; email: string | null; phone: string | null; address: string | null}>>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  
  // Default values for the form
  const defaultValues = {
    vendedor: "",
    fabricante: "GRUPO UCMV",
    instalador: "",
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    projectName: "",
    projectType: "",
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
  
  // State for the client modal
  const [showClientModal, setShowClientModal] = useState(false);
  
  const [totals, setTotals] = useState({
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
  });
  
  const form = useForm<z.infer<typeof cotizacionFormSchema>>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues,
  });
  
  // Fetch clients from Supabase on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log("Starting to fetch clients...");
        setIsLoadingClients(true);
        const supabase = createClientComponentClient();
        
        console.log("Querying 'clientes' table...");
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('nombre');
          
        if (error) {
          console.error("Error fetching clients:", error);
          toastError("Error al cargar clientes: " + error.message);
          return;
        }
        
        console.log("Raw client data from Supabase:", data);
        
        // Transform the data to match the expected format
        const formattedClients = data.map(client => ({
          id: client.id_cliente,
          name: client.nombre,
          email: client.correo,
          phone: client.celular,
          address: client.direccion
        }));
        
        console.log("Formatted clients:", formattedClients);
        setClients(formattedClients);
      } catch (error) {
        console.error("Error:", error);
        toastError(error instanceof Error ? error.message : 'Error desconocido al cargar clientes');
      } finally {
        setIsLoadingClients(false);
      }
    };
    
    fetchClients();
  }, []);
  
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

  // State for tracking scroll position to show/hide back to top button
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle new client submission
  const handleNewClient = async (clientData: { id: string; nombre: string; correo?: string; celular?: string; direccion?: string }) => {
    try {
      // Update the form with the new client data
      form.setValue("clientId", clientData.id);
      form.setValue("clientName", clientData.nombre);
      form.setValue("clientEmail", clientData.correo || "");
      form.setValue("clientPhone", clientData.celular || "");
      form.setValue("clientAddress", clientData.direccion || "");
      
      // Add the new client to the clients list for immediate selection
      setClients(prevClients => [
        ...prevClients,
        {
          id: clientData.id,
          name: clientData.nombre,
          email: clientData.correo || null,
          phone: clientData.celular || null,
          address: clientData.direccion || null
        }
      ]);
      
      console.log("Cliente agregado correctamente:", clientData);
    } catch (error) {
      console.error("Error handling new client:", error);
      toastError(error instanceof Error ? error.message : 'Error al procesar cliente');
    }
  };
  
  // Form submission handler
  const onSubmit = (data: z.infer<typeof cotizacionFormSchema>) => {
    console.log("Form submitted:", data);
    // Here you would typically send the data to your API
  };

  // Calculate the number of filled sections for progress
  const calculateProgress = () => {
    let completedSections = 0;
    const totalSections = 5;
    
    // Section 1: Client & Project Info
    if (form.watch("clientName") && form.watch("projectName")) {
      completedSections++;
    }
    
    // Section 2: Materials
    const materials = form.watch("materialsCombination");
    if (materials.matHuacal || materials.matVista) {
      completedSections++;
    }
    
    // Section 3: Products
    if (items.length > 0) {
      completedSections++;
    }
    
    // Section 4: Payment Terms
    if (form.watch("paymentTerms")) {
      completedSections++;
    }
    
    // Section 5: Terms & Conditions
    if (form.watch("terms")) {
      completedSections++;
    }
    
    return {
      completed: completedSections,
      total: totalSections,
      percentage: (completedSections / totalSections) * 100
    };
  };

  const progress = calculateProgress();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
        {/* Section 1: Project & Client Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Información del Proyecto y Cliente</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 1 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Company Information Row */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-4">Información de la Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="vendedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VENDEDORES.map(vendedor => (
                            <SelectItem key={vendedor.id} value={vendedor.name}>
                              {vendedor.name}
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
                  name="fabricante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabricante</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar fabricante" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FABRICANTES.map(fabricante => (
                            <SelectItem key={fabricante.id} value={fabricante.name}>
                              {fabricante.name}
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
                  name="instalador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instalador</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar instalador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INSTALADORES.map(instalador => (
                            <SelectItem key={instalador.id} value={instalador.name}>
                              {instalador.name}
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
            
            <Separator className="my-8" />
            
            {/* Project Information */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-4">Información del Proyecto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Proyecto</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_PROYECTO.map(tipo => (
                            <SelectItem key={tipo.id} value={tipo.name}>
                              {tipo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                "h-11 w-full pl-3 text-left font-normal",
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
                            onSelect={(date) => {
                              field.onChange(date);
                              // When cotizacionDate changes, update validUntil to be 15 days later
                              if (date) {
                                const validUntilDate = addDays(date, 15);
                                form.setValue("validUntil", validUntilDate);
                              }
                            }}
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
                                "h-11 w-full pl-3 text-left font-normal",
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
            
            <Separator className="my-8" />
            
            {/* Client Information */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                <h3 className="text-base font-medium">Información del Cliente</h3>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="cliente">Cliente</Label>
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select
                          disabled={isLoadingClients}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value) {
                              const selectedClient = clients.find(client => client.id === value);
                              if (selectedClient) {
                                form.setValue("clientName", selectedClient.name);
                                form.setValue("clientEmail", selectedClient.email || "");
                                form.setValue("clientPhone", selectedClient.phone || "");
                                form.setValue("clientAddress", selectedClient.address || "");
                              }
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue 
                                placeholder={isLoadingClients ? "Cargando clientes..." : "Seleccionar cliente"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingClients ? (
                              <SelectItem key="loading" value="loading" disabled>Cargando clientes...</SelectItem>
                            ) : clients.length > 0 ? (
                              clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem key="empty" value="empty" disabled>No hay clientes disponibles</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="h-9 w-full md:w-auto"
                    onClick={() => setShowClientModal(true)}
                  >
                    + Nuevo Cliente
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Client details */}
        {(form.watch("clientName") || form.watch("clientEmail") || form.watch("clientPhone") || form.watch("clientAddress")) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-muted mt-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11" />
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
                        {...field}
                        value={field.value || ''}
                        className="min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="h-11" />
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
                      <Input {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
        {/* Section 2: Materials Selection */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Materiales y Acabados</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 2 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-medium">Combinación de Materiales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Column 1: Estructura */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">Materiales de Estructura</h4>
                
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
              </div>
              
              {/* Column 2: Vista */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">Materiales de Vista</h4>
                
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
              
              {/* Column 3: Herrajes */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">Herrajes y Accesorios</h4>
                
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
            <div className="mt-8 bg-muted/20 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-4">Vista Previa de Especificaciones</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Estructura</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Material Huacal:</p>
                      <p className="font-medium">{form.watch("materialsCombination.matHuacal") || "No seleccionado"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Chapacinta Huacal:</p>
                      <p className="font-medium">{form.watch("materialsCombination.chapHuacal") || "No seleccionado"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Vista</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Material Vista:</p>
                      <p className="font-medium">{form.watch("materialsCombination.matVista") || "No seleccionado"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Chapacinta Vista:</p>
                      <p className="font-medium">{form.watch("materialsCombination.chapVista") || "No seleccionado"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Herrajes</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Jaladera:</p>
                      <p className="font-medium">{form.watch("materialsCombination.jaladera") || "No seleccionado"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Corredera:</p>
                      <p className="font-medium">{form.watch("materialsCombination.corredera") || "No seleccionado"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bisagra:</p>
                      <p className="font-medium">{form.watch("materialsCombination.bisagra") || "No seleccionado"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Section 3: Products and Items */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Productos y Servicios</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 3 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Lista de Productos</h3>
              
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
                      area: "",
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
            
            {/* Table Headers for Products */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 py-2 px-4 bg-muted rounded-lg text-sm font-medium text-gray-600">
              <div className="md:col-span-2">Área</div>
              <div className="md:col-span-2">Producto</div>
              <div className="md:col-span-1 text-center">Cant.</div>
              <div className="md:col-span-1 text-center">Cajones</div>
              <div className="md:col-span-1 text-center">Puertas</div>
              <div className="md:col-span-1 text-center">Entrepaños</div>
              <div className="md:col-span-2 text-right">Precio Unitario</div>
              <div className="md:col-span-1 text-right">Total</div>
              <div className="md:col-span-1 text-right">Acciones</div>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => {
                // Calculate the item total
                const quantity = new Decimal(item.quantity || 0);
                const unitPrice = new Decimal(item.unitPrice || 0);
                const discount = new Decimal(item.discount || 0).div(100);
                const itemTotal = quantity.mul(unitPrice).mul(new Decimal(1).minus(discount));
                
                return (
                  <Card key={item.id} className="shadow-sm overflow-hidden border border-muted">
                    <div className="p-4 border-b bg-muted/30 flex justify-between items-center md:hidden">
                      <h5 className="font-medium">
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
                    
                    <div className="p-4 grid md:grid-cols-12 gap-4 items-center">
                      {/* Area */}
                      <div className="md:col-span-2">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mb-1">Área</div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.area`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className="h-10" placeholder="Ej: Cocina" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Product Name */}
                      <div className="md:col-span-2">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mb-1">Producto</div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
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
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Seleccionar" />
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
                      </div>
                      
                      {/* Quantity */}
                      <div className="md:col-span-1">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mb-1">Cantidad</div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0.01" 
                                  step="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                                  className="h-10 text-center"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Drawers */}
                      <div className="md:col-span-1">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mb-1">Cajones</div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.drawers`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                  className="h-10 text-center"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Doors */}
                      <div className="md:col-span-1">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mb-1">Puertas</div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.doors`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                  className="h-10 text-center"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Shelves */}
                      <div className="md:col-span-1">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mb-1">Entrepaños</div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.shelves`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                  className="h-10 text-center"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Unit Price */}
                      <div className="md:col-span-2">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mb-1">Precio Unitario</div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  step="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                                  className="h-10 text-right"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Item Total */}
                      <div className="md:col-span-1 flex items-center justify-end">
                        <div className="block md:hidden text-sm font-medium text-gray-500 mr-2">Total:</div>
                        <div className="text-right font-medium">
                          {formatCurrencyDisplay(itemTotal)}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="md:col-span-1 text-right hidden md:block">
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
                    
                    {/* Description - bottom row */}
                    <div className="px-4 pb-4 border-t border-muted/50 pt-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field}
                                value={field.value || ''}
                                rows={2}
                                className="resize-none text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-2 grid grid-cols-2 gap-4">
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
                                  className="h-8 text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-300 rounded-lg bg-muted/20 text-center">
                  <p className="text-gray-500 mb-4">No hay productos agregados</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.setValue("items", [
                        {
                          id: crypto.randomUUID(),
                          area: "",
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
                    className="h-10 gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Producto
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-muted/20 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-4">Resumen de Productos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {items.length}
                      </div>
                      <span className="text-gray-600">Productos agregados</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {items.reduce((sum, item) => sum + (item.doors || 0), 0)}
                      </div>
                      <span className="text-gray-600">Puertas en total</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {items.reduce((sum, item) => sum + (item.drawers || 0), 0)}
                      </div>
                      <span className="text-gray-600">Cajones en total</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {items.reduce((sum, item) => sum + (item.shelves || 0), 0)}
                      </div>
                      <span className="text-gray-600">Entrepaños en total</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrencyDisplay(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%)</span>
                    <span className="font-medium">{formatCurrencyDisplay(totals.taxes)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">{formatCurrencyDisplay(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Section 4: Pricing and Payment Terms */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Condiciones de Pago y Entrega</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 4 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Términos de Pago</h3>
                
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Esquema de Pago</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Seleccionar esquema" />
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
                  name={"paymentInfo" as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Información de Pago</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información bancaria, métodos de pago, etc."
                          className="resize-none min-h-[120px]"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Términos de Entrega</h3>
                
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
                
                {/* Resumen de Presupuesto */}
                <div className="rounded-lg overflow-hidden shadow-sm border bg-white mt-6 p-6">
                  <h3 className="text-lg font-medium mb-4">Resumen de Presupuesto</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatCurrencyDisplay(totals.subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-gray-700">
                      <span>IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%)</span>
                      <span className="font-medium">{formatCurrencyDisplay(totals.taxes)}</span>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold">{formatCurrencyDisplay(totals.total)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="text-gray-600">Anticipo (70%)</span>
                        <span className="font-medium">{formatCurrencyDisplay(totals.total.mul(0.7))}</span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="text-gray-600">Liquidación (30%)</span>
                        <span className="font-medium">{formatCurrencyDisplay(totals.total.mul(0.3))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Section 5: Terms and Notes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Términos y Notas</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 5 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Términos y Condiciones</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value || ''}
                        rows={5}
                        className="min-h-[120px]"
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
                        {...field}
                        value={field.value || ''}
                        rows={3}
                        className="min-h-[100px]"
                        placeholder="Notas adicionales sobre el proyecto, condiciones especiales, etc."
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
                        {...field}
                        value={field.value || ''}
                        rows={3}
                        className="min-h-[100px]"
                        placeholder="Información adicional que deba incluirse en la cotización"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Back to top button */}
        {showBackToTop && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="fixed bottom-24 right-4 h-10 w-10 rounded-full shadow-md"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
        
        {/* Progress Indicator and Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-4 z-10">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-64 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-black h-2.5 rounded-full" 
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {progress.completed} de {progress.total} secciones completadas
              </span>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="h-10 px-4">
                Cancelar
              </Button>
              <Button type="button" variant="secondary" className="h-10 px-4">
                Guardar Borrador
              </Button>
              <Button type="submit" className="h-10 px-4 bg-black hover:bg-gray-800 gap-1">
                <Check className="mr-2 h-4 w-4" />
                Guardar Cotización
              </Button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Cliente Modal */}
      <NuevoClienteModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSave={handleNewClient}
      />
    </Form>
  );
}