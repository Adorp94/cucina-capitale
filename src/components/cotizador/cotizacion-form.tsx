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
import { CustomCombobox } from "@/components/cotizador/customized-combobox";
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
  number: z.string().min(1, { message: "Número de cotización requerido" }),
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
  const [materials, setMaterials] = useState<Array<{
    id_material: number;
    tipo: string;
    nombre: string;
    costo: number;
    categoria: string;
    comentario: string;
  }>>([]);
  
  // Add state for each specific material type
  const [tabletosMaterials, setTabletosMaterials] = useState<any[]>([]);
  const [chapacintaMaterials, setChapacintaMaterials] = useState<any[]>([]);
  const [jaladeraMaterials, setJaladeraMaterials] = useState<any[]>([]);
  const [correderasMaterials, setCorrederasMaterials] = useState<any[]>([]);
  const [bisagrasMaterials, setBisagrasMaterials] = useState<any[]>([]);
  
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [totals, setTotals] = useState({
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isCotizacionDateOpen, setIsCotizacionDateOpen] = useState(false);
  const [isValidUntilOpen, setIsValidUntilOpen] = useState(false);
  
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
      number: "",
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

  // Fetch materials from Supabase on mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Fetch materials from database
  const fetchMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('tipo', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Filter materials by type - retained for legacy components if needed
  const getMaterialsByType = (tipo: string) => {
    return materials.filter(material => material.tipo === tipo);
  };

  // Add function to fetch materials by type directly from the database
  const fetchMaterialsByType = async (tipo: string) => {
    try {
      const supabase = createClientComponentClient();
      
      // Direct database query is more efficient than client-side filtering
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .eq('tipo', tipo);

      if (error) {
        console.error(`Error fetching ${tipo} materials:`, error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error(`Error in fetchMaterialsByType for ${tipo}:`, err);
      return [];
    }
  };

  // Fetch all material types on mount
  useEffect(() => {
    const fetchAllMaterialTypes = async () => {
      setIsLoadingMaterials(true);
      try {
        // Fetch all materials (still needed for other components)
        fetchMaterials();
        
        // Fetch each material type directly with SQL query
        const tabletos = await fetchMaterialsByType('Tabletos');
        setTabletosMaterials(tabletos);
        
        const chapacinta = await fetchMaterialsByType('Chapacinta');
        setChapacintaMaterials(chapacinta);
        
        const jaladera = await fetchMaterialsByType('Jaladera');
        setJaladeraMaterials(jaladera);
        
        const correderas = await fetchMaterialsByType('Correderas');
        setCorrederasMaterials(correderas);
        
        const bisagras = await fetchMaterialsByType('Bisagras');
        setBisagrasMaterials(bisagras);
      } catch (error) {
        console.error('Error fetching material types:', error);
      } finally {
        setIsLoadingMaterials(false);
      }
    };
    
    fetchAllMaterialTypes();
  }, []);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client information section card */}
        <Card className="shadow-sm rounded-lg">
          <CardHeader className="py-4 px-6 border-b bg-muted/30 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Información de Cliente</CardTitle>
            <Badge variant="outline" className="text-sm font-normal">Sección 1 de 5</Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cliente" className="text-base font-medium">Cliente</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-9"
                onClick={() => setShowClientModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Cliente
              </Button>
            </div>
            
            {/* Client selection field */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <CustomCombobox
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
                      disabled={isLoadingClients}
                      popoverWidth={320}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client details grid */}
            {form.watch("clientId") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-1">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-2">Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-11 w-full px-3" />
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
                      <FormLabel className="mb-2">Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-11 w-full px-3" />
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
                      <FormLabel className="mb-2">Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="h-11 w-full px-3" />
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
                      <FormLabel className="mb-2">Dirección</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value || ''}
                          className="min-h-[80px] resize-none w-full px-3 py-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Project information card */}
        <Card className="shadow-sm rounded-lg">
          <CardHeader className="py-4 px-6 border-b bg-muted/30 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Información del Proyecto</CardTitle>
            <Badge variant="outline" className="text-sm font-normal">Sección 2 de 5</Badge>
          </CardHeader>
          <CardContent className="p-6">
            {/* Project information fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-6">
              {/* Número de Cotización */}
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Número de Cotización</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 w-full px-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombre del Proyecto */}
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Nombre del Proyecto</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 w-full px-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Proyecto */}
              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Tipo de Proyecto</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full px-3">
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

              {/* Vendedor */}
              <FormField
                control={form.control}
                name="vendedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Vendedor</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full px-3">
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

              {/* Fabricante */}
              <FormField
                control={form.control}
                name="fabricante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Fabricante</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full px-3">
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

              {/* Instalador */}
              <FormField
                control={form.control}
                name="instalador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Instalador</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full px-3">
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

              {/* Fecha de Cotización */}
              <FormField
                control={form.control}
                name="cotizacionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-2">Fecha de Cotización</FormLabel>
                    <Popover open={isCotizacionDateOpen} onOpenChange={setIsCotizacionDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-11 w-full px-3 text-left font-normal justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            // Set validUntil to 15 days after the selected date
                            if (date) {
                              form.setValue("validUntil", addDays(date, 15));
                            }
                            setIsCotizacionDateOpen(false);
                          }}
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

              {/* Válida Hasta */}
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-2">Válida Hasta</FormLabel>
                    <Popover open={isValidUntilOpen} onOpenChange={setIsValidUntilOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-11 w-full px-3 text-left font-normal justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsValidUntilOpen(false);
                          }}
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
          </CardContent>
        </Card>
        
        {/* Products and Materials section card */}
        <Card className="shadow-sm rounded-lg">
          <CardHeader className="py-4 px-6 border-b bg-muted/30 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Productos, Servicios y Materiales</CardTitle>
            <Badge variant="outline" className="text-sm font-normal">Sección 3 de 5</Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Materials Selection */}
              <div>
                <h3 className="text-base font-medium mb-4">Especificaciones de materiales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                  {/* Material Huacal */}
                  <FormField
                    control={form.control}
                    name="materials.matHuacal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Material Huacal</FormLabel>
                        <FormControl>
                          <CustomCombobox
                            options={tabletosMaterials.map(material => ({
                              label: material.nombre,
                              value: material.nombre,
                              data: material
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={isLoadingMaterials ? "Cargando..." : "Seleccionar material"}
                            disabled={isLoadingMaterials}
                            popoverWidth={320}
                            className="h-11 w-full"
                          />
                        </FormControl>
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
                        <FormLabel className="mb-2">Chapacinta Huacal</FormLabel>
                        <FormControl>
                          <CustomCombobox
                            options={chapacintaMaterials.map(material => ({
                              label: material.nombre,
                              value: material.nombre,
                              data: material
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={isLoadingMaterials ? "Cargando..." : "Seleccionar chapacinta"}
                            disabled={isLoadingMaterials}
                            popoverWidth={320}
                            className="h-11 w-full"
                          />
                        </FormControl>
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
                        <FormLabel className="mb-2">Jaladera</FormLabel>
                        <FormControl>
                          <CustomCombobox
                            options={jaladeraMaterials.map(material => ({
                              label: material.nombre,
                              value: material.nombre,
                              data: material
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={isLoadingMaterials ? "Cargando..." : "Seleccionar jaladera"}
                            disabled={isLoadingMaterials}
                            popoverWidth={320}
                            className="h-11 w-full"
                          />
                        </FormControl>
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
                        <FormLabel className="mb-2">Material Vista</FormLabel>
                        <FormControl>
                          <CustomCombobox
                            options={tabletosMaterials.map(material => ({
                              label: material.nombre,
                              value: material.nombre,
                              data: material
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={isLoadingMaterials ? "Cargando..." : "Seleccionar material"}
                            disabled={isLoadingMaterials}
                            popoverWidth={320}
                            className="h-11 w-full"
                          />
                        </FormControl>
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
                        <FormLabel className="mb-2">Chapacinta Vista</FormLabel>
                        <FormControl>
                          <CustomCombobox
                            options={chapacintaMaterials.map(material => ({
                              label: material.nombre,
                              value: material.nombre,
                              data: material
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={isLoadingMaterials ? "Cargando..." : "Seleccionar chapacinta"}
                            disabled={isLoadingMaterials}
                            popoverWidth={320}
                            className="h-11 w-full"
                          />
                        </FormControl>
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
                        <FormLabel className="mb-2">Corredera</FormLabel>
                        <FormControl>
                          <CustomCombobox
                            options={correderasMaterials.map(material => ({
                              label: material.nombre,
                              value: material.nombre,
                              data: material
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={isLoadingMaterials ? "Cargando..." : "Seleccionar corredera"}
                            disabled={isLoadingMaterials}
                            popoverWidth={320}
                            className="h-11 w-full"
                          />
                        </FormControl>
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
                        <FormLabel className="mb-2">Bisagra</FormLabel>
                        <FormControl>
                          <CustomCombobox
                            options={bisagrasMaterials.map(material => ({
                              label: material.nombre,
                              value: material.nombre,
                              data: material
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={isLoadingMaterials ? "Cargando..." : "Seleccionar bisagra"}
                            disabled={isLoadingMaterials}
                            popoverWidth={320}
                            className="h-11 w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h3 className="text-base font-medium mb-4">Productos y servicios</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead className="w-[100px] bg-muted/30 py-3">Área</TableHead>
                        <TableHead className="bg-muted/30 py-3">Producto / Descripción</TableHead>
                        <TableHead className="text-center bg-muted/30 py-3">Cant.</TableHead>
                        <TableHead className="text-center bg-muted/30 py-3">Cajones</TableHead>
                        <TableHead className="text-center bg-muted/30 py-3">Puertas</TableHead>
                        <TableHead className="text-center bg-muted/30 py-3">Entrepaños</TableHead>
                        <TableHead className="text-right bg-muted/30 py-3">Precio</TableHead>
                        <TableHead className="text-right bg-muted/30 py-3">Total</TableHead>
                        <TableHead className="w-[50px] bg-muted/30 py-3"></TableHead>
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
                          <tr key={field.id} className={index % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                            <td className="py-3 px-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.area`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Área"
                                        className="h-9 px-3"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Descripción"
                                        className="h-9 px-3"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        placeholder="Cant."
                                        min={1}
                                        className="h-9 text-center px-3"
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.drawers`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        placeholder="0"
                                        min={0}
                                        className="h-9 text-center px-3"
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.doors`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        placeholder="0"
                                        min={0}
                                        className="h-9 text-center px-3"
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.shelves`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        placeholder="0"
                                        min={0}
                                        className="h-9 text-center px-3"
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        placeholder="$0.00"
                                        min={0}
                                        step={0.01}
                                        className="h-9 text-right px-3"
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-3 text-right font-medium">
                              {formatCurrencyDisplay(
                                new Decimal(form.watch(`items.${index}.quantity`) || 0)
                                  .mul(new Decimal(form.watch(`items.${index}.unitPrice`) || 0))
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
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
                <div className="flex justify-start mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1 h-10"
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
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Producto
                  </Button>
                </div>
                
                {/* Totals area */}
                <div className="pt-5 border-t mt-6">
                  <div className="ml-auto md:w-72">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{formatCurrencyDisplay(totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%):</span>
                        <span>{formatCurrencyDisplay(totals.taxes)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg pt-3 border-t">
                        <span>Total:</span>
                        <span>{formatCurrencyDisplay(totals.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional information section card */}
        <Card className="shadow-sm rounded-lg">
          <CardHeader className="py-4 px-6 border-b bg-muted/30 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Información Adicional</CardTitle>
            <Badge variant="outline" className="text-sm font-normal">Sección 5 de 5</Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-6">
              {/* Delivery time */}
              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Tiempo de Entrega (días hábiles)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="h-11 px-3"
                        min={1}
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Payment terms */}
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Condiciones de Pago</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[80px] resize-none px-3 py-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Notes */}
            <div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Notas Adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        className="min-h-[120px] resize-none px-3 py-2"
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md py-5 px-6 z-10">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-72 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-black h-3 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(progress)}% completado
              </span>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="h-11 px-5 font-medium">
                Cancelar
              </Button>
              <Button type="button" variant="secondary" className="h-11 px-5 font-medium">
                Guardar Borrador
              </Button>
              <Button type="submit" className="h-11 px-5 bg-black hover:bg-gray-800 gap-2 font-medium">
                <Check className="h-4 w-4" />
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