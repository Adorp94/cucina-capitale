'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';
import { 
  Plus, X, ChevronRight, Edit2, PenTool, Trash2, 
  ChevronDown, ChevronUp, CalendarIcon, ArrowUp, Check, Loader2, Search 
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
import { Combobox } from "@/components/ui/combobox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

import { calculateQuotationTotals } from '@/lib/cotizador/calculator';
import { formatCurrency as formatCurrencyUtil } from '@/lib/cotizador/calculator';
import { DEFAULT_COTIZADOR_CONFIG, generateQuotationNumber } from '@/lib/cotizador/constants';
import { CreateQuotationFormData, createQuotationSchema, quotationItemSchema } from '@/types/cotizacion';

// Use a modified schema for the form with fixed QuotationItem issue
// We'll use this for the form and handle the conversion in onSubmit
const cotizacionFormSchema = z.object({
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
  
  // Team information
  vendedor: z.string().min(1, { message: "Vendedor requerido" }),
  fabricante: z.string().min(1, { message: "Fabricante requerido" }),
  instalador: z.string().min(1, { message: "Instalador requerido" }),
  
  // Delivery and Payment
  deliveryTime: z.number().int().min(1, { message: "Tiempo de entrega requerido" }),
  paymentTerms: z.string().min(1, { message: "Condiciones de pago requeridas" }),
  
  // Materials
  materials: z.record(z.string().optional()).optional(),
  
  // Products and Items
  items: z.array(
    quotationItemSchema
      .omit({ quotationId: true, subtotal: true })
      .extend({ position: z.number().optional() })
  ),
  
  // Terms and Notes
  notes: z.string().optional(),
});

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

// Types for form should match what's used in createQuotationSchema
type FormValues = z.infer<typeof cotizacionFormSchema>;

// Format currency for display
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
  const { toast } = useToast();
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
        toast({
          id: "error-cliente",
          title: "Error",
          description: "Error al guardar el cliente: " + error.message
        });
        return;
      }
      
      console.log("Cliente creado:", newClient);
      toast({
        id: "cliente-creado",
        title: "Cliente creado",
        description: `El cliente "${data.nombre}" ha sido creado exitosamente`
      });
      
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
      toast({
        id: "error-general",
        title: "Error",
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
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

// Main component
export default function CotizacionForm() {
  // State for form and UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("cotizacion");
  const [currentSection, setCurrentSection] = useState<string>("cliente-proyecto");
  const [clients, setClients] = useState<Array<{id: string; name: string; email: string | null; phone: string | null; address: string | null}>>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [totals, setTotals] = useState({
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Toast notifications
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues: {
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      projectName: "",
      projectType: "",
      cotizacionDate: new Date(),
      validUntil: addDays(new Date(), 15),
      deliveryTime: 30,
      materials: {},
      vendedor: "",
      fabricante: "",
      instalador: "",
      paymentTerms: "70% anticipo, 30% contra entrega",
      items: [],
      notes: "",
    },
  });

  // Set up fieldArray for items (products)
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Fetch clients from Supabase on mount
  useEffect(() => {
    fetchClients();
  }, []);
  
  // Fetch clients from database
  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('clientes')
        .select('id_cliente, nombre, correo, celular, direccion')
        .order('nombre', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      // Format the data to match our UI needs
      const formattedClients = data.map(client => ({
        id: client.id_cliente,
        name: client.nombre,
        email: client.correo,
        phone: client.celular,
        address: client.direccion
      }));
      
      setClients(formattedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Use mock data in case of error
      setClients(MOCK_CLIENTS);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Handle new client creation from modal
  const handleNewClient = (clientData: { id: string; nombre: string; correo?: string; celular?: string; direccion?: string }) => {
    const newClient = {
      id: clientData.id,
      name: clientData.nombre,
      email: clientData.correo || null,
      phone: clientData.celular || null,
      address: clientData.direccion || null
    };
    
    // Add to clients list
    setClients(prevClients => [
      newClient,
      ...prevClients
    ]);
    
    // Select the new client
    form.setValue("clientId", newClient.id);
    form.setValue("clientName", newClient.name);
    form.setValue("clientEmail", newClient.email || "");
    form.setValue("clientPhone", newClient.phone || "");
    form.setValue("clientAddress", newClient.address || "");
  };

  // Recalculate totals whenever form items change
  useEffect(() => {
    const items = form.getValues("items") || [];
    // Add positions if not present to avoid type errors
    const itemsWithPosition = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    try {
      const { subtotal, taxes, total } = calculateQuotationTotals(itemsWithPosition, DEFAULT_COTIZADOR_CONFIG.taxRate);
      
      // Update totals state
      setTotals({
        subtotal,
        taxes,
        total
      });
    } catch (error) {
      console.error("Error calculating totals:", error);
    }
  }, [form.watch("items")]);

  // Calculate progress for the progress bar
  const calculateProgress = useCallback(() => {
    const values = form.getValues();
    let progress = 0;
    
    // Cliente-Proyecto Section - 25%
    if (values.clientId && values.projectName && values.projectType) {
      progress += 25;
    }
    
    // Materiales Section - 25%
    const materialsSelected = values.materials && Object.values(values.materials).some(val => val);
    if (materialsSelected) {
      progress += 25;
    }
    
    // Productos Section - 25%
    if (values.items && values.items.length > 0) {
      progress += 25;
    }
    
    // Extras Section - 25%
    if (values.vendedor && values.fabricante && values.instalador) {
      progress += 25;
    }
    
    return progress;
  }, [form]);

  const progress = calculateProgress();

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit form
  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    
    // Process form data here, e.g., save to database
    console.log("Form submitted:", data);
    
    toast({
      id: "cotizacion-guardada",
      title: "Cotización guardada",
      description: "La cotización se ha guardado exitosamente."
    });
    
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Client information card - where we'll focus */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Información de Cliente y Proyecto</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 1 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cliente selection - first column */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="h-9 ml-auto"
                    onClick={() => setShowClientModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo Cliente
                  </Button>
                </div>
                <div className="mt-2">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Combobox
                            options={clients.map(client => ({
                              label: client.name,
                              value: client.id,
                              data: client
                            }))}
                            value={field.value || ''}
                            onChange={(value) => {
                              field.onChange(value);
                              // Find the selected client and update form fields
                              const selectedClient = clients.find(client => client.id === value);
                              if (selectedClient) {
                                form.setValue("clientName", selectedClient.name);
                                form.setValue("clientEmail", selectedClient.email || "");
                                form.setValue("clientPhone", selectedClient.phone || "");
                                form.setValue("clientAddress", selectedClient.address || "");
                              } else {
                                // Clear client details if no client is selected
                                form.setValue("clientName", "");
                                form.setValue("clientEmail", "");
                                form.setValue("clientPhone", "");
                                form.setValue("clientAddress", "");
                              }
                            }}
                            placeholder={isLoadingClients ? "Cargando clientes..." : "Seleccionar cliente"}
                            emptyMessage="No se encontraron clientes"
                            disabled={isLoadingClients}
                            popoverWidth={320}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Client details only show when a client is selected */}
                {form.watch("clientId") && (
                  <>
                    {/* Client details - first column bottom */}
                    <div className="space-y-4 w-full mt-4">
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11 w-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientEmail"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="h-11 w-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Second column for client details, only show when a client is selected */}
              {form.watch("clientId") && (
                <div className="space-y-4 w-full mt-8 md:mt-0">
                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11 w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            value={field.value || ''}
                            className="min-h-[80px] resize-none w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Project information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Información del Proyecto</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 2 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Project information */}
              <div className="space-y-4">
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
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar tipo de proyecto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_PROYECTO.map(tipo => (
                            <SelectItem key={tipo.id} value={tipo.id}>
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
              
              {/* Date information */}
              <div className="space-y-4">
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
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
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
                      <FormLabel>Válida Hasta</FormLabel>
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
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Materials selection */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Especificación de Materiales</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 3 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Material Huacal */}
              <FormField
                control={form.control}
                name="materials.matHuacal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Huacal</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_MATERIALS.matHuacal.map(material => (
                          <SelectItem key={material.id_material} value={material.nombre}>
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Chapacinta Huacal */}
              <FormField
                control={form.control}
                name="materials.chapHuacal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapacinta Huacal</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar chapacinta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_MATERIALS.chapHuacal.map(material => (
                          <SelectItem key={material.id_material} value={material.nombre}>
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Material Vista */}
              <FormField
                control={form.control}
                name="materials.matVista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Vista</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_MATERIALS.matVista.map(material => (
                          <SelectItem key={material.id_material} value={material.nombre}>
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Chapacinta Vista */}
              <FormField
                control={form.control}
                name="materials.chapVista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapacinta Vista</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar chapacinta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_MATERIALS.chapVista.map(material => (
                          <SelectItem key={material.id_material} value={material.nombre}>
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Jaladera */}
              <FormField
                control={form.control}
                name="materials.jaladera"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jaladera</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar jaladera" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_MATERIALS.jaladera.map(material => (
                          <SelectItem key={material.id_material} value={material.nombre}>
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Corredera */}
              <FormField
                control={form.control}
                name="materials.corredera"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corredera</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar corredera" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_MATERIALS.corredera.map(material => (
                          <SelectItem key={material.id_material} value={material.nombre}>
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Bisagra */}
              <FormField
                control={form.control}
                name="materials.bisagra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bisagra</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar bisagra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_MATERIALS.bisagra.map(material => (
                          <SelectItem key={material.id_material} value={material.nombre}>
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Products and items section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Productos y Servicios</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 4 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* List of items */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead className="w-[100px]">Área</TableHead>
                      <TableHead>Producto / Descripción</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-center">Cajones</TableHead>
                      <TableHead className="text-center">Puertas</TableHead>
                      <TableHead className="text-center">Entrepaños</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </tr>
                  </TableHeader>
                  <tbody>
                    {fields.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="h-24 text-center text-muted-foreground">
                          No hay productos agregados aún
                        </td>
                      </tr>
                    ) : (
                      fields.map((field, index) => (
                        <tr key={field.id} className="border-b">
                          <td className="py-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.area`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Área"
                                      className="h-9"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Descripción"
                                      className="h-9"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="Cant."
                                      min={1}
                                      className="h-9 text-center"
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.drawers`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="0"
                                      min={0}
                                      className="h-9 text-center"
                                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.doors`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="0"
                                      min={0}
                                      className="h-9 text-center"
                                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.shelves`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="0"
                                      min={0}
                                      className="h-9 text-center"
                                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="$0.00"
                                      min={0}
                                      step={0.01}
                                      className="h-9 text-right"
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatCurrencyDisplay(
                              new Decimal(form.watch(`items.${index}.quantity`) || 0)
                                .mul(new Decimal(form.watch(`items.${index}.unitPrice`) || 0))
                            )}
                          </td>
                          <td className="py-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
              
              {/* Add product button */}
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1"
                  onClick={() =>
                    append({
                      id: "",
                      description: "",
                      area: "",
                      quantity: 1,
                      unitPrice: 0,
                      discount: 0,
                      drawers: 0,
                      doors: 0,
                      shelves: 0,
                      position: fields.length,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>
              
              {/* Totals */}
              <div className="pt-4 border-t">
                <div className="ml-auto md:w-72">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrencyDisplay(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%):</span>
                      <span>{formatCurrencyDisplay(totals.taxes)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>{formatCurrencyDisplay(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Extras and additional information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle>Información Adicional</CardTitle>
              <Badge variant="outline" className="text-sm font-normal">Sección 5 de 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Delivery and payment */}
              <div className="space-y-4">
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
                          className="h-11"
                          min={1}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones de Pago</FormLabel>
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
              </div>
              
              {/* Team information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="vendedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VENDEDORES.map(vendedor => (
                            <SelectItem key={vendedor.id} value={vendedor.id}>
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
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar fabricante" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FABRICANTES.map(fabricante => (
                            <SelectItem key={fabricante.id} value={fabricante.id}>
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
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar instalador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INSTALADORES.map(instalador => (
                            <SelectItem key={instalador.id} value={instalador.id}>
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
            
            {/* Notes */}
            <div>
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
                        className="min-h-[120px] resize-none"
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
        
        {/* Fixed bottom panel */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-4 z-10">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-64 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-black h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}% completado
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