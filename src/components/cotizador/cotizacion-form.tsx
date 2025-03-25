'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';
import { 
  Plus, X, ChevronRight, Edit2, PenTool, Trash2, 
  ChevronDown, ChevronUp, CalendarIcon, ArrowUp, Check, Loader2, Search, Calculator 
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
import { CreateQuotationFormData, createQuotationSchema } from '@/types/cotizacion';

// Define furniture data schema for storing complete inventory records
const furnitureDataSchema = z.object({
  mueble_id: z.number(),
  cajones: z.number().nullable(),
  puertas: z.number().nullable(),
  entrepaños: z.number().nullable(),
  mat_huacal: z.number().nullable(),
  mat_vista: z.number().nullable(),
  chap_huacal: z.number().nullable(),
  chap_vista: z.number().nullable(),
  jaladera: z.number().nullable(),
  corredera: z.number().nullable(),
  bisagras: z.number().nullable(),
  patas: z.number().nullable(),
  clip_patas: z.number().nullable(),
  mensulas: z.number().nullable(),
  kit_tornillo: z.number().nullable(),
  cif: z.number().nullable(),
}).optional();

// Define material data schema to store the selected material and its cost
const materialDataSchema = z.object({
  id_material: z.number(),
  nombre: z.string(),
  costo: z.number(),
  tipo: z.string().nullable(),
  categoria: z.string().nullable(),
  comentario: z.string().nullable(),
}).optional();

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
  
  // Materials with their data
  materials: z.record(z.string().optional()).optional(),
  materialsData: z.object({
    matHuacal: materialDataSchema,
    matVista: materialDataSchema,
    chapHuacal: materialDataSchema,
    chapVista: materialDataSchema,
    jaladera: materialDataSchema,
    corredera: materialDataSchema,
    bisagra: materialDataSchema,
  }).partial().optional(),
  
  // Products and Items
  items: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1, { message: "Descripción requerida" }),
      area: z.string().optional(),
      quantity: z.number().int().min(1, { message: "Cantidad debe ser al menos 1" }),
      unitPrice: z.number().min(0, { message: "Precio unitario debe ser positivo" }),
      discount: z.number().min(0).max(100, { message: "Descuento debe estar entre 0 y 100" }).default(0),
      drawers: z.number().int().min(0).default(0),
      doors: z.number().int().min(0).default(0),
      shelves: z.number().int().min(0).default(0),
      position: z.number().optional(),
      type: z.string().optional(),
      furnitureData: furnitureDataSchema,
    })
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
  return `$${amount.toFixed(2)}`.replace('$$', '$');
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
  
  // Add state for inventory items
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [rowInventory, setRowInventory] = useState<Record<number, { 
    items: any[],
    hasMore: boolean,
    page: number,
    searchQuery: string,
    selectedType: string
  }>>({});
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [currentTypeFilter, setCurrentTypeFilter] = useState('');
  const [furnitureTypes, setFurnitureTypes] = useState<string[]>([]);
  const [isLoadingFurnitureTypes, setIsLoadingFurnitureTypes] = useState(false);
  
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [totals, setTotals] = useState({
    subtotal: new Decimal(0),
    taxes: new Decimal(0),
    total: new Decimal(0),
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isCotizacionDateOpen, setIsCotizacionDateOpen] = useState(false);
  const [isValidUntilOpen, setIsValidUntilOpen] = useState(false);
  
  // Add accessory state
  const [accesoriosList, setAccesoriosList] = useState<any[]>([]);
  const [isLoadingAccesorios, setIsLoadingAccesorios] = useState(false);
  
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
      materialsData: {},
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

  // Fetch materials, clients, and other data on component mount
  useEffect(() => {
    fetchMaterials();
    fetchClients();
    fetchFurnitureTypes();
    fetchInventory('', '', null, 1, false); // Load initial set of inventory items
    fetchAccesorios(); // Load accessories from new table
  }, []);
  
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

  // Fetch inventory items with optional filtering by search term and selected type
  const fetchInventory = async (
    searchQuery = '', 
    selectedType = '', 
    rowIndex: number | null = null,
    page = 1,
    append = false
  ) => {
    setIsLoadingInventory(true);
    try {
      const PAGE_SIZE = 20; // Number of items per page
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const supabase = createClientComponentClient();
      let query = supabase
        .from('inventario')
        .select('*', { count: 'exact' });
      
      // Filter by type if selected
      if (selectedType) {
        query = query.ilike('tipo', selectedType);
      }
      
      // Add search filter
      if (searchQuery) {
        query = query.ilike('nombre_mueble', `%${searchQuery}%`);
      }
      
      // Add pagination
      query = query.range(from, to);
      
      // Order results
      query = query.order('nombre_mueble');
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching inventory items:', error);
        throw error;
      }
      
      // Determine if there are more items to load
      const hasMore = count ? from + data.length < count : false;
      
      // Store the results in row-specific state or global state
      if (rowIndex !== null) {
        // Create a copy of the current state to modify
        const newRowInventory = { ...rowInventory };
        
        // Initialize if not exist or append items
        if (!newRowInventory[rowIndex] || !append) {
          newRowInventory[rowIndex] = {
            items: data || [],
            hasMore,
            page,
            searchQuery,
            selectedType
          };
        } else {
          // Append items to existing list
          newRowInventory[rowIndex] = {
            items: [...newRowInventory[rowIndex].items, ...(data || [])],
            hasMore,
            page,
            searchQuery,
            selectedType
          };
        }
        
        setRowInventory(newRowInventory);
      } else {
        // Update global inventory items
        if (append) {
          setInventoryItems(prev => [...prev, ...(data || [])]);
        } else {
          setInventoryItems(data || []);
        }
      }
    } catch (error) {
      console.error('Error in fetchInventory:', error);
      if (rowIndex !== null) {
        // Update row-specific inventory with empty array or keep existing
        if (!append) {
          const newRowInventory = { ...rowInventory };
          newRowInventory[rowIndex] = {
            items: [],
            hasMore: false,
            page: 1,
            searchQuery,
            selectedType
          };
          setRowInventory(newRowInventory);
        }
      } else if (!append) {
        setInventoryItems([]);
      }
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Function to handle searching inventory items
  const searchInventoryItems = (searchQuery: string, selectedType: string = '', rowIndex: number | null = null) => {
    // If this is for a specific row, handle it that way
    if (rowIndex !== null) {
      // Maintain the current type filter if not specified in this search
      const typeFilter = selectedType || (form.watch(`items.${rowIndex}.type`) || '');
      
      // Reset pagination and search when query changes
      fetchInventory(searchQuery, typeFilter, rowIndex, 1, false);
    } else {
      // Global search (legacy behavior)
      // Maintain the current type filter if not specified in this search
      if (!selectedType && currentTypeFilter) {
        selectedType = currentTypeFilter;
      }
      
      // Update current type filter
      setCurrentTypeFilter(selectedType);
      
      // Reset pagination and search
      fetchInventory(searchQuery, selectedType, null, 1, false);
    }
  };
  
  // Function to load more items
  const loadMoreInventoryItems = (rowIndex: number | null = null) => {
    if (rowIndex !== null && rowInventory[rowIndex]) {
      const { page, searchQuery, selectedType } = rowInventory[rowIndex];
      fetchInventory(searchQuery, selectedType, rowIndex, page + 1, true);
    } else {
      // Global load more (legacy behavior)
      // Implementation would depend on how we track global pagination
      // For simplicity, we'll just fetch the next page of current results
      fetchInventory('', currentTypeFilter, null, 2, true);
    }
  };
  
  // Fetch furniture types using the database RPC function
  const fetchFurnitureTypes = async () => {
    setIsLoadingFurnitureTypes(true);
    
    // Default fallback types
    const fallbackTypes = [
      'Alacena', 'Base', 'Despensero', 'Gabinete', 'Isla',
      'Mueble Baño', 'Mueble TV', 'Pantry', 'Refrigerador', 
      'Closet', 'Cajonera', 'Librero'
    ];
    
    try {
      const supabase = createClientComponentClient();
      
      // Call the RPC function 
      const { data, error } = await supabase
        .rpc('get_furniture_types');
      
      if (error) {
        console.error('Error calling get_furniture_types RPC:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Extract 'tipo' property from each item
        const typeStrings = data.map((item: { tipo: string }) => item.tipo);
        setFurnitureTypes(typeStrings);
      } else {
        // Use fallback types if no data returned
        setFurnitureTypes(fallbackTypes);
      }
    } catch (error) {
      console.error('Failed to fetch furniture types:', error);
      // Use fallback types in case of error
      setFurnitureTypes(fallbackTypes);
    } finally {
      setIsLoadingFurnitureTypes(false);
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
        
        // Fetch accessories from the new accesorios table
        fetchAccesorios();
        
        // Fetch initial set of inventory items
        fetchInventory();
        
        // Fetch furniture types
        fetchFurnitureTypes();
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
    
    // Force recalculation of prices before computing totals to ensure they're correct
    const updatedItems = [...items].map((item, index) => {
      if (!item.furnitureData) return item;
      
      const fd = item.furnitureData;
      const projectType = form.getValues('projectType');
      const materialsData = form.getValues('materialsData') || {};
      
      // Calculate correct price using the same logic as calculateItemPrice
      let totalPrice = new Decimal(0);
      let multiplier = projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1;
      
      // Add all material components
      if (fd.mat_huacal && materialsData.matHuacal) {
        totalPrice = totalPrice.plus(new Decimal(fd.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier));
      }
      if (fd.mat_vista && materialsData.matVista) {
        totalPrice = totalPrice.plus(new Decimal(fd.mat_vista).times(materialsData.matVista.costo).times(multiplier));
      }
      if (fd.chap_huacal && materialsData.chapHuacal) {
        totalPrice = totalPrice.plus(new Decimal(fd.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier));
      }
      if (fd.chap_vista && materialsData.chapVista) {
        totalPrice = totalPrice.plus(new Decimal(fd.chap_vista).times(materialsData.chapVista.costo).times(multiplier));
      }
      if (fd.jaladera && materialsData.jaladera) {
        totalPrice = totalPrice.plus(new Decimal(fd.jaladera).times(materialsData.jaladera.costo).times(multiplier));
      }
      if (fd.corredera && materialsData.corredera) {
        totalPrice = totalPrice.plus(new Decimal(fd.corredera).times(materialsData.corredera.costo).times(multiplier));
      }
      if (fd.bisagras && materialsData.bisagra) {
        totalPrice = totalPrice.plus(new Decimal(fd.bisagras).times(materialsData.bisagra.costo).times(multiplier));
      }
      
      // Add accessory components
      if (fd.patas && fd.patas > 0) {
        const patasMaterial = accesoriosList.find(acc => 
          acc.accesorios.toLowerCase().includes('pata') || 
          acc.categoria.toLowerCase().includes('pata')
        );
        totalPrice = totalPrice.plus(new Decimal(fd.patas).times(patasMaterial?.costo || 15).times(multiplier));
      }
      if (fd.clip_patas && fd.clip_patas > 0) {
        const clipMaterial = accesoriosList.find(acc => 
          acc.accesorios.toLowerCase().includes('clip') || 
          acc.categoria.toLowerCase().includes('clip')
        );
        totalPrice = totalPrice.plus(new Decimal(fd.clip_patas).times(clipMaterial?.costo || 5).times(multiplier));
      }
      if (fd.mensulas && fd.mensulas > 0) {
        const mensulasMaterial = accesoriosList.find(acc => 
          acc.accesorios.toLowerCase().includes('mensul') || 
          acc.categoria.toLowerCase().includes('mensul')
        );
        totalPrice = totalPrice.plus(new Decimal(fd.mensulas).times(mensulasMaterial?.costo || 8).times(multiplier));
      }
      if (fd.kit_tornillo && fd.kit_tornillo > 0) {
        const kitMaterial = accesoriosList.find(acc => 
          acc.accesorios.toLowerCase().includes('tornillo') || 
          acc.categoria.toLowerCase().includes('tornillo')
        );
        totalPrice = totalPrice.plus(new Decimal(fd.kit_tornillo).times(kitMaterial?.costo || 10).times(multiplier));
      }
      if (fd.cif && fd.cif > 0) {
        const cifMaterial = accesoriosList.find(acc => 
          acc.accesorios.toLowerCase().includes('cif') || 
          acc.categoria.toLowerCase().includes('cif')
        );
        totalPrice = totalPrice.plus(new Decimal(fd.cif).times(cifMaterial?.costo || 12).times(multiplier));
      }
      
      // Convert to number with precise decimal places
      const finalPrice = totalPrice.toDecimalPlaces(2).toNumber();
      
      // Return the item with the correctly calculated price
      return {
        ...item,
        unitPrice: finalPrice
      };
    });
    
    // Update form items if needed
    let pricesChanged = false;
    updatedItems.forEach((item, index) => {
      const originalItem = items[index];
      if (Math.abs((originalItem?.unitPrice || 0) - (item?.unitPrice || 0)) > 0.01) {
        pricesChanged = true;
        form.setValue(`items.${index}.unitPrice`, item.unitPrice);
      }
    });
    
    if (pricesChanged) {
      // Wait a bit for the form to update
      setTimeout(() => {
        debugCalculationMismatch();
      }, 100);
    }
    
    // Add positions if not present to avoid type errors and ensure description is there
    const itemsWithPosition = updatedItems.map((item, index) => ({
      ...item,
      position: index,
      description: item.description || `Item ${index + 1}` // Ensure description exists
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
  }, [form.watch("items"), accesoriosList]);

  // Add this useEffect to recalculate all prices when project type changes
  useEffect(() => {
    const projectType = form.watch("projectType");
    
    // Skip if there are no items yet or if we're initially loading
    const items = form.getValues("items") || [];
    if (items.length === 0 || isLoadingMaterials) return;
    
    console.log("Project type changed to:", projectType);
    
    // Update prices for all items when project type changes
    items.forEach((item, index) => {
      if (item.furnitureData) {
        calculateItemPrice(index, item.furnitureData);
      }
    });
  }, [form.watch("projectType")]);

  // Add this new useEffect to recalculate prices specifically when material selections change
  useEffect(() => {
    // Skip if there are no items yet or if we're loading materials
    const items = form.getValues("items") || [];
    if (items.length === 0 || isLoadingMaterials) return;
    
    const materialsData = form.getValues("materialsData");
    console.log("Material selections changed. Recalculating prices for all items:", materialsData);
    
    // Update prices for all items with the new material costs
    items.forEach((item, index) => {
      if (item.furnitureData) {
        calculateItemPrice(index, item.furnitureData);
      }
    });
  }, [
    form.watch("materialsData.matHuacal"), 
    form.watch("materialsData.chapHuacal"),
    form.watch("materialsData.matVista"), 
    form.watch("materialsData.chapVista"), 
    form.watch("materialsData.jaladera"), 
    form.watch("materialsData.corredera"), 
    form.watch("materialsData.bisagra")
  ]);

  // Recalculate item prices when project type or materials change
  useEffect(() => {
    // Skip if there are no items yet
    const items = form.getValues("items") || [];
    if (items.length === 0) return;
    
    // Get the current values we care about
    const projectType = form.getValues("projectType");
    const materialsData = form.getValues("materialsData");
    
    console.log("Recalculating prices due to project type or material change", { projectType, materialsData });
    
    // Update prices for all items
    items.forEach((item, index) => {
      if (item.furnitureData) {
        calculateItemPrice(index, item.furnitureData);
      }
    });
  }, [form]);  // Just depend on the form itself

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
    
    // Log furniture data specifically to confirm it's correctly collected
    const furnitureData = data.items.map((item, index) => ({
      index,
      description: item.description,
      furnitureData: item.furnitureData
    }));
    
    console.log("Collected furniture data:", furnitureData);
    
    // Log materials data to verify costs are stored
    console.log("Selected materials with costs:", data.materialsData);
    
    toast({
      id: "cotizacion-guardada",
      title: "Cotización guardada",
      description: "La cotización se ha guardado exitosamente."
    });
    
    setIsSubmitting(false);
  };

  // Helper function to find an accessory by name or category
  const findAccessory = (criteria: { name?: string, category?: string }) => {
    if (!accesoriosList || accesoriosList.length === 0) {
      console.log("No accessories loaded yet");
      return null;
    }
    
    let result = null;
    
    // Try to find by exact name match first
    if (criteria.name && criteria.name.length > 0) {
      result = accesoriosList.find(acc => 
        acc.accesorios?.toLowerCase().includes(criteria.name?.toLowerCase())
      );
    }
    
    // If not found by name, try category
    if (!result && criteria.category && criteria.category.length > 0) {
      result = accesoriosList.find(acc => 
        acc.categoria?.toLowerCase().includes(criteria.category?.toLowerCase())
      );
    }
    
    // Log for debugging
    if (result) {
      console.log(`Found accessory for ${criteria.name || criteria.category}: ${result.accesorios} - $${result.costo}`);
    } else {
      console.log(`No accessory found for ${criteria.name || criteria.category}`);
    }
    
    return result;
  };

  // Calculate the price based on the furniture data and selected materials
  const calculateItemPrice = (index: number, furnitureData: any) => {
    try {
      /* 
       * PRICE CALCULATION PROCESS:
       * 1. The BASE PRICE is calculated from all individual components (materials, accessories)
       * 2. This base price is shown as the UNIT PRICE (not editable)
       * 3. The SUBTOTAL is calculated as: UNIT PRICE × QUANTITY
       * 4. Price calculations take into account the PROJECT TYPE (Residencial, Desarrollo, etc.)
       *    which applies different multipliers to the costs.
       */
      
      // Get all the required values
      const projectType = form.getValues('projectType');
      const materialsData = form.getValues('materialsData') || {};
      
      // Check if project type is selected
      if (!projectType) {
        console.error("Project type not selected. Please select a project type first.");
        toast({
          id: "project-type-missing",
          title: "Error de cálculo",
          description: "Por favor seleccione un tipo de proyecto primero."
        });
        return;
      }
      
      // Determine multiplier (identical code across all functions)
      let multiplier = 1;
      if (projectType === "1") { // Residencial
        multiplier = 1.8; // 180%
        console.log("Using Residencial multiplier: 1.8 (180%)");
      } else if (projectType === "3") { // Desarrollo
        multiplier = 1.5; // 150%
        console.log("Using Desarrollo multiplier: 1.5 (150%)");
      } else {
        console.log(`Using default multiplier: 1.0 (100%) for project type: ${projectType}`);
      }
      
      console.log(`Project type: ${projectType}, Multiplier: ${multiplier}`);
      
      // Initialize total price with Decimal for better precision
      let totalPrice = new Decimal(0);
      
      // Calculate all component costs with detailed logging
      let componentLog = [];
      
      // Calculations for base materials with enhanced logging
      if (furnitureData.mat_huacal && materialsData.matHuacal) {
        const cost = new Decimal(furnitureData.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`mat_huacal: ${furnitureData.mat_huacal} * ${materialsData.matHuacal.costo} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.mat_vista && materialsData.matVista) {
        const cost = new Decimal(furnitureData.mat_vista).times(materialsData.matVista.costo).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`mat_vista: ${furnitureData.mat_vista} * ${materialsData.matVista.costo} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.chap_huacal && materialsData.chapHuacal) {
        const cost = new Decimal(furnitureData.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`chap_huacal: ${furnitureData.chap_huacal} * ${materialsData.chapHuacal.costo} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.chap_vista && materialsData.chapVista) {
        const cost = new Decimal(furnitureData.chap_vista).times(materialsData.chapVista.costo).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`chap_vista: ${furnitureData.chap_vista} * ${materialsData.chapVista.costo} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.jaladera && materialsData.jaladera) {
        const cost = new Decimal(furnitureData.jaladera).times(materialsData.jaladera.costo).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`jaladera: ${furnitureData.jaladera} * ${materialsData.jaladera.costo} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.corredera && materialsData.corredera) {
        const cost = new Decimal(furnitureData.corredera).times(materialsData.corredera.costo).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`corredera: ${furnitureData.corredera} * ${materialsData.corredera.costo} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.bisagras && materialsData.bisagra) {
        const cost = new Decimal(furnitureData.bisagras).times(materialsData.bisagra.costo).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`bisagras: ${furnitureData.bisagras} * ${materialsData.bisagra.costo} * ${multiplier} = ${cost}`);
      }
      
      // Direct accessory calculations with enhanced logging
      if (furnitureData.patas && furnitureData.patas > 0) {
        const patasMaterial = findAccessory({ name: 'patas', category: 'patas' });
        const cost = new Decimal(furnitureData.patas).times(patasMaterial?.costo || 15).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`patas: ${furnitureData.patas} * ${patasMaterial?.costo || 15} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.clip_patas && furnitureData.clip_patas > 0) {
        const clipMaterial = findAccessory({ name: 'clip_patas', category: 'clip patas' });
        const cost = new Decimal(furnitureData.clip_patas).times(clipMaterial?.costo || 5).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`clip_patas: ${furnitureData.clip_patas} * ${clipMaterial?.costo || 5} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.mensulas && furnitureData.mensulas > 0) {
        const mensulasMaterial = findAccessory({ name: 'mensulas', category: 'mensulas' });
        const cost = new Decimal(furnitureData.mensulas).times(mensulasMaterial?.costo || 8).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`mensulas: ${furnitureData.mensulas} * ${mensulasMaterial?.costo || 8} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.kit_tornillo && furnitureData.kit_tornillo > 0) {
        const kitMaterial = findAccessory({ name: 'kit_tornillo', category: 'kit tornillo' });
        const cost = new Decimal(furnitureData.kit_tornillo).times(kitMaterial?.costo || 10).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`kit_tornillo: ${furnitureData.kit_tornillo} * ${kitMaterial?.costo || 10} * ${multiplier} = ${cost}`);
      }
      
      if (furnitureData.cif && furnitureData.cif > 0) {
        const cifMaterial = findAccessory({ name: 'cif', category: 'cif' });
        const cost = new Decimal(furnitureData.cif).times(cifMaterial?.costo || 12).times(multiplier);
        totalPrice = totalPrice.plus(cost);
        componentLog.push(`cif: ${furnitureData.cif} * ${cifMaterial?.costo || 12} * ${multiplier} = ${cost}`);
      }
      
      // Generate a summary of all component costs for debugging
      console.log("Price components for consistent calculation:");
      componentLog.forEach(log => console.log(`- ${log}`));
      console.log("Total calculated price before rounding:", totalPrice.toString());
      
      // Convert to number with precise decimal places for consistency
      const finalPrice = totalPrice.toDecimalPlaces(2).toNumber();
      console.log(`Final rounded price for item ${index}: ${finalPrice}`);
      
      // IMPORTANT: Directly update the unitPrice field and ensure it's properly stored
      form.setValue(`items.${index}.unitPrice`, finalPrice);
      
      // Verify the value was saved correctly
      const savedValue = form.getValues(`items.${index}.unitPrice`);
      console.log(`Saved price value for item ${index}: ${savedValue}`);
      
      if (savedValue !== finalPrice) {
        console.warn(`Value mismatch! Calculated: ${finalPrice}, Saved: ${savedValue}`);
        // Try to force update if there's a mismatch
        setTimeout(() => {
          form.setValue(`items.${index}.unitPrice`, finalPrice);
        }, 50);
      }
      
      // Force verification via debug function
      setTimeout(() => {
        debugCalculationMismatch();
      }, 100);
    } catch (error) {
      console.error('Error calculating item price:', error);
      toast({
        id: "calculation-error",
        title: "Error de cálculo",
        description: "Ocurrió un error al calcular el precio. Revise los datos e intente nuevamente."
      });
    }
  };

  // Fetch accessories from database
  const fetchAccesorios = async () => {
    setIsLoadingAccesorios(true);
    try {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('accesorios')
        .select('id_accesorios, accesorios, costo, categoria, comentario')
        .order('categoria', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setAccesoriosList(data);
        console.log("Loaded accessories from accesorios table:", data.map(acc => 
          `${acc.accesorios} (${acc.categoria}): $${acc.costo}`
        ));
        
        // Test lookups for common accessory types
        setTimeout(() => {
          console.log("Testing accessory lookups:");
          findAccessory({ name: 'patas' });
          findAccessory({ name: 'clip' });
          findAccessory({ name: 'mensula' });
          findAccessory({ name: 'tornillo' });
          findAccessory({ name: 'cif' });
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      toast({
        id: "error-accesorios",
        title: "Error",
        description: "No se pudieron cargar los accesorios"
      });
    } finally {
      setIsLoadingAccesorios(false);
    }
  };

  // Add a new function to recalculate all prices
  const recalculateAllPrices = () => {
    try {
      console.log("Starting recalculation of all prices");
      
      const items = form.getValues('items');
      const projectType = form.getValues('projectType');
      const materialsData = form.getValues('materialsData') || {};
      
      // Check if project type is selected
      if (!projectType) {
        console.error("Project type not selected. Please select a project type first.");
        toast({
          id: "project-type-missing",
          title: "Error de cálculo",
          description: "Por favor seleccione un tipo de proyecto primero."
        });
        return;
      }
      
      // Determine multiplier based on project type
      let multiplier = 1;
      if (projectType === "1") { // Residencial
        multiplier = 1.8; // 180%
        console.log("Using Residencial multiplier: 1.8 (180%)");
      } else if (projectType === "3") { // Desarrollo
        multiplier = 1.5; // 150%
        console.log("Using Desarrollo multiplier: 1.5 (150%)");
      } else {
        console.log(`Using default multiplier: 1.0 (100%) for project type: ${projectType}`);
      }
      
      console.log(`Project type: ${projectType}, Multiplier: ${multiplier}`);
      
      // Create a copy of the items to update
      const updatedItems = [...items];
      
      // Recalculate the price for each item
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const fd = item.furnitureData;
        
        if (!fd) {
          console.log(`Item ${index} has no furniture data. Skipping price calculation.`);
          continue;
        }
        
        // Initialize total price
        let totalPrice = new Decimal(0);
        let componentLog = [];
        
        console.log(`Calculating price for item ${index}`);
        
        // Calculate all material costs with the same consistent logic
        if (fd.mat_huacal && materialsData.matHuacal) {
          const cost = new Decimal(fd.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`mat_huacal: ${fd.mat_huacal} * ${materialsData.matHuacal.costo} * ${multiplier} = ${cost}`);
        }
        
        if (fd.mat_vista && materialsData.matVista) {
          const cost = new Decimal(fd.mat_vista).times(materialsData.matVista.costo).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`mat_vista: ${fd.mat_vista} * ${materialsData.matVista.costo} * ${multiplier} = ${cost}`);
        }
        
        if (fd.chap_huacal && materialsData.chapHuacal) {
          const cost = new Decimal(fd.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`chap_huacal: ${fd.chap_huacal} * ${materialsData.chapHuacal.costo} * ${multiplier} = ${cost}`);
        }
        
        if (fd.chap_vista && materialsData.chapVista) {
          const cost = new Decimal(fd.chap_vista).times(materialsData.chapVista.costo).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`chap_vista: ${fd.chap_vista} * ${materialsData.chapVista.costo} * ${multiplier} = ${cost}`);
        }
        
        if (fd.jaladera && materialsData.jaladera) {
          const cost = new Decimal(fd.jaladera).times(materialsData.jaladera.costo).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`jaladera: ${fd.jaladera} * ${materialsData.jaladera.costo} * ${multiplier} = ${cost}`);
        }
        
        if (fd.corredera && materialsData.corredera) {
          const cost = new Decimal(fd.corredera).times(materialsData.corredera.costo).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`corredera: ${fd.corredera} * ${materialsData.corredera.costo} * ${multiplier} = ${cost}`);
        }
        
        if (fd.bisagras && materialsData.bisagra) {
          const cost = new Decimal(fd.bisagras).times(materialsData.bisagra.costo).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`bisagras: ${fd.bisagras} * ${materialsData.bisagra.costo} * ${multiplier} = ${cost}`);
        }
        
        // Calculate accessories costs consistently
        if (fd.patas && fd.patas > 0) {
          const patasMaterial = findAccessory({ name: 'patas', category: 'patas' });
          const cost = new Decimal(fd.patas).times(patasMaterial?.costo || 15).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`patas: ${fd.patas} * ${patasMaterial?.costo || 15} * ${multiplier} = ${cost}`);
        }
        
        if (fd.clip_patas && fd.clip_patas > 0) {
          const clipMaterial = findAccessory({ name: 'clip_patas', category: 'clip patas' });
          const cost = new Decimal(fd.clip_patas).times(clipMaterial?.costo || 5).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`clip_patas: ${fd.clip_patas} * ${clipMaterial?.costo || 5} * ${multiplier} = ${cost}`);
        }
        
        if (fd.mensulas && fd.mensulas > 0) {
          const mensulasMaterial = findAccessory({ name: 'mensulas', category: 'mensulas' });
          const cost = new Decimal(fd.mensulas).times(mensulasMaterial?.costo || 8).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`mensulas: ${fd.mensulas} * ${mensulasMaterial?.costo || 8} * ${multiplier} = ${cost}`);
        }
        
        if (fd.kit_tornillo && fd.kit_tornillo > 0) {
          const kitMaterial = findAccessory({ name: 'kit_tornillo', category: 'kit tornillo' });
          const cost = new Decimal(fd.kit_tornillo).times(kitMaterial?.costo || 10).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`kit_tornillo: ${fd.kit_tornillo} * ${kitMaterial?.costo || 10} * ${multiplier} = ${cost}`);
        }
        
        if (fd.cif && fd.cif > 0) {
          const cifMaterial = findAccessory({ name: 'cif', category: 'cif' });
          const cost = new Decimal(fd.cif).times(cifMaterial?.costo || 12).times(multiplier);
          totalPrice = totalPrice.plus(cost);
          componentLog.push(`cif: ${fd.cif} * ${cifMaterial?.costo || 12} * ${multiplier} = ${cost}`);
        }
        
        // Log the detailed calculation for this item
        console.log(`Detailed calculation for item ${index}:`);
        componentLog.forEach(log => console.log(`- ${log}`));
        
        // Convert to number with precise decimal places
        const finalPrice = totalPrice.toDecimalPlaces(2).toNumber();
        console.log(`Final calculated price for item ${index}: ${finalPrice}`);
        
        // Store the calculated price in our temporary array
        updatedItems[index].unitPrice = finalPrice;
      }
      
      // Batch update all prices at once
      form.setValue('items', updatedItems);
      
      // Verify prices were updated correctly
      setTimeout(() => {
        const updatedValues = form.getValues('items');
        console.log("Verifying updated prices:", updatedValues.map((item, i) => 
          `Item ${i}: ${item.unitPrice}`
        ));
        
        // Force UI update for debug section
        const debugSection = document.getElementById('debug-section');
        if (debugSection && debugSection.style.display !== 'none') {
          debugSection.classList.toggle('updated');
          setTimeout(() => debugSection.classList.toggle('updated'), 50);
        }
        
        // Run debug function to verify
        debugCalculationMismatch();
      }, 100);
      
      console.log("Completed recalculation of all prices");
    } catch (error) {
      console.error('Error recalculating prices:', error);
      toast({
        id: "recalculation-error",
        title: "Error de recálculo",
        description: "Ocurrió un error al recalcular los precios."
      });
    }
  };

  // Add this useEffect to make sure the updates are reflected in the UI
  useEffect(() => {
    // We specifically want to watch item prices to ensure they display correctly
    const subscription = form.watch((value, { name }) => {
      if (name && name.includes('items') && name.includes('unitPrice')) {
        console.log(`Price updated for ${name}:`, form.getValues(name));
        
        // Force UI update for debug section
        const debugSection = document.getElementById('debug-section');
        if (debugSection && debugSection.style.display !== 'none') {
          // Toggle a class to force React to re-render this section
          debugSection.classList.toggle('updated');
          setTimeout(() => debugSection.classList.toggle('updated'), 50);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Helper function to ensure calculation consistency
  const debugCalculationMismatch = () => {
    const items = form.getValues("items") || [];
    if (items.length === 0) return;
    
    // Log the current form state
    console.log("=========== DEBUGGING PRICE CALCULATION MISMATCH ===========");
    console.log("Current form items:", items);
    
    items.forEach((item, index) => {
      if (!item.furnitureData) return;
      
      // Get necessary values
      const projectType = form.getValues('projectType');
      const materialsData = form.getValues('materialsData') || {};
      const fd = item.furnitureData;
      
      // Skip if no project type
      if (!projectType) return;
      
      // Calculate using original calculateItemPrice logic (simplified for comparison)
      let originalTotal = new Decimal(0);
      if (fd.mat_huacal && materialsData.matHuacal) {
        originalTotal = originalTotal.plus(new Decimal(fd.mat_huacal).times(materialsData.matHuacal.costo).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.mat_vista && materialsData.matVista) {
        originalTotal = originalTotal.plus(new Decimal(fd.mat_vista).times(materialsData.matVista.costo).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.chap_huacal && materialsData.chapHuacal) {
        originalTotal = originalTotal.plus(new Decimal(fd.chap_huacal).times(materialsData.chapHuacal.costo).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.chap_vista && materialsData.chapVista) {
        originalTotal = originalTotal.plus(new Decimal(fd.chap_vista).times(materialsData.chapVista.costo).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.jaladera && materialsData.jaladera) {
        originalTotal = originalTotal.plus(new Decimal(fd.jaladera).times(materialsData.jaladera.costo).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.corredera && materialsData.corredera) {
        originalTotal = originalTotal.plus(new Decimal(fd.corredera).times(materialsData.corredera.costo).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.bisagras && materialsData.bisagra) {
        originalTotal = originalTotal.plus(new Decimal(fd.bisagras).times(materialsData.bisagra.costo).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      
      // Directly add accessories without any material lookup 
      if (fd.patas && fd.patas > 0) {
        const patasMaterial = findAccessory({ name: 'patas', category: 'patas' });
        const cost = patasMaterial ? patasMaterial.costo : 15;
        originalTotal = originalTotal.plus(new Decimal(fd.patas).times(cost).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.clip_patas && fd.clip_patas > 0) {
        const clipMaterial = findAccessory({ name: 'clip_patas', category: 'clip patas' });
        const cost = clipMaterial ? clipMaterial.costo : 5; 
        originalTotal = originalTotal.plus(new Decimal(fd.clip_patas).times(cost).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.mensulas && fd.mensulas > 0) {
        const mensulasMaterial = findAccessory({ name: 'mensulas', category: 'mensulas' });
        const cost = mensulasMaterial ? mensulasMaterial.costo : 8;
        originalTotal = originalTotal.plus(new Decimal(fd.mensulas).times(cost).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.kit_tornillo && fd.kit_tornillo > 0) {
        const kitMaterial = findAccessory({ name: 'kit_tornillo', category: 'kit tornillo' });
        const cost = kitMaterial ? kitMaterial.costo : 10;
        originalTotal = originalTotal.plus(new Decimal(fd.kit_tornillo).times(cost).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      if (fd.cif && fd.cif > 0) {
        const cifMaterial = findAccessory({ name: 'cif', category: 'cif' });
        const cost = cifMaterial ? cifMaterial.costo : 12;
        originalTotal = originalTotal.plus(new Decimal(fd.cif).times(cost).times(projectType === "1" ? 1.8 : projectType === "3" ? 1.5 : 1));
      }
      
      const originalFinalPrice = originalTotal.toDecimalPlaces(2).toNumber();
      const storedPrice = item.unitPrice || 0;
      const discrepancy = Math.abs(originalFinalPrice - storedPrice) > 0.01;
      
      console.log(`Item ${index + 1} (${item.description || 'Unknown'}):`);
      console.log(`- Calculated price: $${originalFinalPrice}`);
      console.log(`- Stored price: $${storedPrice}`);
      
      if (discrepancy) {
        console.log(`⚠️ DISCREPANCY DETECTED! Difference: $${Math.abs(originalFinalPrice - storedPrice).toFixed(2)}`);
        console.log("Furniture data:", fd);
        console.log("Materials data:", materialsData);
      }
    });
    
    console.log("=========== END DEBUGGING ===========");
  };

  const handleFurnitureSelection = (value: string, index: number) => {
    console.log(`Selected furniture value: ${value} for index: ${index}`);
    
    // Find the selected inventory item based on nombre_mueble
    const selectedItem = rowInventory[index]?.items.find((item) => item.nombre_mueble === value);
    console.log("Selected item:", selectedItem);
    
    if (selectedItem) {
      // Store furniture data for price calculation
      const furnitureData = {
        mueble_id: selectedItem.mueble_id,
        mat_huacal: selectedItem.mat_huacal || 0,
        mat_vista: selectedItem.mat_vista || 0,
        chap_huacal: selectedItem.chap_huacal || 0,
        chap_vista: selectedItem.chap_vista || 0,
        jaladera: selectedItem.jaladera || 0,
        corredera: selectedItem.corredera || 0,
        bisagras: selectedItem.bisagras || 0,
        patas: selectedItem.patas || 0,
        clip_patas: selectedItem.clip_patas || 0,
        mensulas: selectedItem.mensulas || 0,
        kit_tornillo: selectedItem.kit_tornillo || 0,
        cif: selectedItem.cif || 0,
      };
      
      console.log("Stored furniture data:", furnitureData);
      
      // First update furniture details in the form
      form.setValue(`items.${index}.detail`, selectedItem.nombre_mueble);
      form.setValue(`items.${index}.quantity`, form.getValues(`items.${index}.quantity`) || 1);
      form.setValue(`items.${index}.furnitureData`, furnitureData);
      
      // Now calculate the price based on materials and project type
      calculateItemPrice(index, furnitureData);
      
      // Debug to verify price calculation consistency
      debugCalculationMismatch();
    }
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
                          className="min-h-[80px] resize-none"
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
            <CardTitle className="text-lg">Especificaciones de materiales</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  const debugSection = document.getElementById('debug-section');
                  if (debugSection) {
                    const isVisible = debugSection.style.display !== 'none';
                    debugSection.style.display = isVisible ? 'none' : 'block';
                    // Update button text
                    const btn = document.getElementById('toggle-debug-btn');
                    if (btn) {
                      btn.textContent = isVisible ? 'Mostrar Debug' : 'Ocultar Debug';
                    }
                  }
                }}
                id="toggle-debug-btn"
              >
                Mostrar Debug
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  console.log("Manual recalculation of all prices");
                  debugCalculationMismatch(); // Debug before recalculation
                  recalculateAllPrices();
                  setTimeout(() => debugCalculationMismatch(), 500); // Debug after recalculation
                }}
              >
                Recalcular Precios
              </Button>
              <Badge variant="outline" className="text-sm font-normal">Sección 3 de 5</Badge>
            </div>
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
                            onChange={(value) => {
                              field.onChange(value);
                              // Store the selected material's data including the cost
                              const selectedMaterial = tabletosMaterials.find(m => m.nombre === value);
                              if (selectedMaterial) {
                                form.setValue('materialsData.matHuacal', {
                                  id_material: selectedMaterial.id_material,
                                  nombre: selectedMaterial.nombre,
                                  costo: selectedMaterial.costo,
                                  tipo: selectedMaterial.tipo,
                                  categoria: selectedMaterial.categoria,
                                  comentario: selectedMaterial.comentario
                                });
                                console.log(`Selected Material Huacal: ${value}, Cost: ${selectedMaterial.costo}`);
                                
                                // Explicitly recalculate all prices
                                recalculateAllPrices();
                              } else {
                                form.setValue('materialsData.matHuacal', undefined);
                              }
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                              // Store the selected material's data including the cost
                              const selectedMaterial = chapacintaMaterials.find(m => m.nombre === value);
                              if (selectedMaterial) {
                                form.setValue('materialsData.chapHuacal', {
                                  id_material: selectedMaterial.id_material,
                                  nombre: selectedMaterial.nombre,
                                  costo: selectedMaterial.costo,
                                  tipo: selectedMaterial.tipo,
                                  categoria: selectedMaterial.categoria,
                                  comentario: selectedMaterial.comentario
                                });
                                console.log(`Selected Chapacinta Huacal: ${value}, Cost: ${selectedMaterial.costo}`);
                                
                                // Explicitly recalculate all prices
                                recalculateAllPrices();
                              } else {
                                form.setValue('materialsData.chapHuacal', undefined);
                              }
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                              // Store the selected material's data including the cost
                              const selectedMaterial = jaladeraMaterials.find(m => m.nombre === value);
                              if (selectedMaterial) {
                                form.setValue('materialsData.jaladera', {
                                  id_material: selectedMaterial.id_material,
                                  nombre: selectedMaterial.nombre,
                                  costo: selectedMaterial.costo,
                                  tipo: selectedMaterial.tipo,
                                  categoria: selectedMaterial.categoria,
                                  comentario: selectedMaterial.comentario
                                });
                                console.log(`Selected Jaladera: ${value}, Cost: ${selectedMaterial.costo}`);
                                
                                // Explicitly recalculate all prices
                                recalculateAllPrices();
                              } else {
                                form.setValue('materialsData.jaladera', undefined);
                              }
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                              // Store the selected material's data including the cost
                              const selectedMaterial = tabletosMaterials.find(m => m.nombre === value);
                              if (selectedMaterial) {
                                form.setValue('materialsData.matVista', {
                                  id_material: selectedMaterial.id_material,
                                  nombre: selectedMaterial.nombre,
                                  costo: selectedMaterial.costo,
                                  tipo: selectedMaterial.tipo,
                                  categoria: selectedMaterial.categoria,
                                  comentario: selectedMaterial.comentario
                                });
                                console.log(`Selected Material Vista: ${value}, Cost: ${selectedMaterial.costo}`);
                                
                                // Explicitly recalculate all prices
                                recalculateAllPrices();
                              } else {
                                form.setValue('materialsData.matVista', undefined);
                              }
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                              // Store the selected material's data including the cost
                              const selectedMaterial = chapacintaMaterials.find(m => m.nombre === value);
                              if (selectedMaterial) {
                                form.setValue('materialsData.chapVista', {
                                  id_material: selectedMaterial.id_material,
                                  nombre: selectedMaterial.nombre,
                                  costo: selectedMaterial.costo,
                                  tipo: selectedMaterial.tipo,
                                  categoria: selectedMaterial.categoria,
                                  comentario: selectedMaterial.comentario
                                });
                                console.log(`Selected Chapacinta Vista: ${value}, Cost: ${selectedMaterial.costo}`);
                                
                                // Explicitly recalculate all prices
                                recalculateAllPrices();
                              } else {
                                form.setValue('materialsData.chapVista', undefined);
                              }
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                              // Store the selected material's data including the cost
                              const selectedMaterial = correderasMaterials.find(m => m.nombre === value);
                              if (selectedMaterial) {
                                form.setValue('materialsData.corredera', {
                                  id_material: selectedMaterial.id_material,
                                  nombre: selectedMaterial.nombre,
                                  costo: selectedMaterial.costo,
                                  tipo: selectedMaterial.tipo,
                                  categoria: selectedMaterial.categoria,
                                  comentario: selectedMaterial.comentario
                                });
                                console.log(`Selected Corredera: ${value}, Cost: ${selectedMaterial.costo}`);
                                
                                // Explicitly recalculate all prices
                                recalculateAllPrices();
                              } else {
                                form.setValue('materialsData.corredera', undefined);
                              }
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                              // Store the selected material's data including the cost
                              const selectedMaterial = bisagrasMaterials.find(m => m.nombre === value);
                              if (selectedMaterial) {
                                form.setValue('materialsData.bisagra', {
                                  id_material: selectedMaterial.id_material,
                                  nombre: selectedMaterial.nombre,
                                  costo: selectedMaterial.costo,
                                  tipo: selectedMaterial.tipo,
                                  categoria: selectedMaterial.categoria,
                                  comentario: selectedMaterial.comentario
                                });
                                console.log(`Selected Bisagra: ${value}, Cost: ${selectedMaterial.costo}`);
                                
                                // Explicitly recalculate all prices
                                recalculateAllPrices();
                              } else {
                                form.setValue('materialsData.bisagra', undefined);
                              }
                            }}
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

              {/* Debug Information Section */}
              <div id="debug-section" className="mt-6 mb-8 p-4 border border-amber-200 bg-amber-50 rounded-md" style={{ display: 'none' }}>
                <h3 className="text-base font-semibold mb-3 flex items-center">
                  <span>Información de Debug (Cálculos)</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto h-8"
                    onClick={() => {
                      const debugSection = document.getElementById('debug-section');
                      if (debugSection) {
                        debugSection.style.display = 'none';
                      }
                    }}
                  >
                    Ocultar Debug
                  </Button>
                </h3>
                
                <div className="space-y-4 text-xs">
                  <div>
                    <p className="font-semibold mb-1">Tipo de Proyecto:</p>
                    {(() => {
                      const projectType = form.watch("projectType");
                      const projectName = TIPOS_PROYECTO.find(t => t.id === projectType)?.name || "No seleccionado";
                      let multiplier = 1;
                      if (projectType === "1") multiplier = 1.8;
                      else if (projectType === "3") multiplier = 1.5;
                      
                      return (
                        <p>
                          {projectName} (ID: {projectType || "N/A"}) - 
                          Multiplicador: <span className="text-blue-600 font-bold">{multiplier}x</span>
                        </p>
                      );
                    })()}
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-1">Costos de Materiales:</p>
                    <ul className="pl-4 space-y-1 list-disc">
                      {(() => {
                        const materialsData = form.watch("materialsData") || {};
                        return (
                          <>
                            <li>Material Huacal: {materialsData.matHuacal ? 
                              `${materialsData.matHuacal.nombre} - $${materialsData.matHuacal.costo}` : 
                              "No seleccionado"}</li>
                            <li>Material Vista: {materialsData.matVista ? 
                              `${materialsData.matVista.nombre} - $${materialsData.matVista.costo}` : 
                              "No seleccionado"}</li>
                            <li>Chapacinta Huacal: {materialsData.chapHuacal ? 
                              `${materialsData.chapHuacal.nombre} - $${materialsData.chapHuacal.costo}` : 
                              "No seleccionado"}</li>
                            <li>Chapacinta Vista: {materialsData.chapVista ? 
                              `${materialsData.chapVista.nombre} - $${materialsData.chapVista.costo}` : 
                              "No seleccionado"}</li>
                            <li>Jaladera: {materialsData.jaladera ? 
                              `${materialsData.jaladera.nombre} - $${materialsData.jaladera.costo}` : 
                              "No seleccionado"}</li>
                            <li>Corredera: {materialsData.corredera ? 
                              `${materialsData.corredera.nombre} - $${materialsData.corredera.costo}` : 
                              "No seleccionado"}</li>
                            <li>Bisagra: {materialsData.bisagra ? 
                              `${materialsData.bisagra.nombre} - $${materialsData.bisagra.costo}` : 
                              "No seleccionado"}</li>
                          </>
                        );
                      })()}
                    </ul>
                  </div>

                  {form.watch("items")?.length > 0 && (
                    <div>
                      <p className="font-semibold mb-1">Cálculos por Mueble:</p>
                      {form.watch("items").map((item, index) => {
                        const projectType = form.watch("projectType");
                        const materialsData = form.watch("materialsData") || {};
                        let multiplier = 1;
                        if (projectType === "1") multiplier = 1.8;
                        else if (projectType === "3") multiplier = 1.5;
                        
                        if (!item.furnitureData) return <p key={index}>Mueble {index + 1}: Sin datos</p>;
                        
                        const fd = item.furnitureData;
                        const calculations = [];
                        
                        if (fd.mat_huacal && materialsData.matHuacal) {
                          const cost = new Decimal(fd.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier);
                          calculations.push(
                            <li key={`mat_huacal-${index}`}>
                              Material Huacal: {fd.mat_huacal} × ${materialsData.matHuacal.costo} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.mat_vista && materialsData.matVista) {
                          const cost = new Decimal(fd.mat_vista).times(materialsData.matVista.costo).times(multiplier);
                          calculations.push(
                            <li key={`mat_vista-${index}`}>
                              Material Vista: {fd.mat_vista} × ${materialsData.matVista.costo} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.chap_huacal && materialsData.chapHuacal) {
                          const cost = new Decimal(fd.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier);
                          calculations.push(
                            <li key={`chap_huacal-${index}`}>
                              Chapacinta Huacal: {fd.chap_huacal} × ${materialsData.chapHuacal.costo} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.chap_vista && materialsData.chapVista) {
                          const cost = new Decimal(fd.chap_vista).times(materialsData.chapVista.costo).times(multiplier);
                          calculations.push(
                            <li key={`chap_vista-${index}`}>
                              Chapacinta Vista: {fd.chap_vista} × ${materialsData.chapVista.costo} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.jaladera && materialsData.jaladera) {
                          const cost = new Decimal(fd.jaladera).times(materialsData.jaladera.costo).times(multiplier);
                          calculations.push(
                            <li key={`jaladera-${index}`}>
                              Jaladera: {fd.jaladera} × ${materialsData.jaladera.costo} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.corredera && materialsData.corredera) {
                          const cost = new Decimal(fd.corredera).times(materialsData.corredera.costo).times(multiplier);
                          calculations.push(
                            <li key={`corredera-${index}`}>
                              Corredera: {fd.corredera} × ${materialsData.corredera.costo} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.bisagras && materialsData.bisagra) {
                          const cost = new Decimal(fd.bisagras).times(materialsData.bisagra.costo).times(multiplier);
                          calculations.push(
                            <li key={`bisagras-${index}`}>
                              Bisagras: {fd.bisagras} × ${materialsData.bisagra.costo} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        // Show accessories calculations
                        if (fd.patas && fd.patas > 0) {
                          const patasMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('pata') || 
                            acc.categoria.toLowerCase().includes('pata')
                          );
                          const cost = new Decimal(fd.patas || 0).times(patasMaterial?.costo || 15).times(multiplier);
                          calculations.push(
                            <li key={`patas-${index}`}>
                              Patas: {fd.patas} × ${patasMaterial?.costo || 15} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.clip_patas && fd.clip_patas > 0) {
                          const clipMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('clip') || 
                            acc.categoria.toLowerCase().includes('clip')
                          );
                          const cost = new Decimal(fd.clip_patas || 0).times(clipMaterial?.costo || 5).times(multiplier);
                          calculations.push(
                            <li key={`clip_patas-${index}`}>
                              Clip Patas: {fd.clip_patas} × ${clipMaterial?.costo || 5} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        if (fd.mensulas && fd.mensulas > 0) {
                          const mensulasMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('mensul') || 
                            acc.categoria.toLowerCase().includes('mensul')
                          );
                          const cost = new Decimal(fd.mensulas || 0).times(mensulasMaterial?.costo || 8).times(multiplier);
                          calculations.push(
                            <li key={`mensulas-${index}`}>
                              Ménsulas: {fd.mensulas} × ${mensulasMaterial?.costo || 8} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        // Add kit_tornillo
                        if (fd.kit_tornillo && fd.kit_tornillo > 0) {
                          const kitTornilloMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('tornillo') || 
                            acc.categoria.toLowerCase().includes('tornillo')
                          );
                          const cost = new Decimal(fd.kit_tornillo || 0).times(kitTornilloMaterial?.costo || 10).times(multiplier);
                          calculations.push(
                            <li key={`kit_tornillo-${index}`}>
                              Kit Tornillo: {fd.kit_tornillo} × ${kitTornilloMaterial?.costo || 10} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        // Add CIF
                        if (fd.cif && fd.cif > 0) {
                          const cifMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('cif') || 
                            acc.categoria.toLowerCase().includes('cif')
                          );
                          const cost = new Decimal(fd.cif || 0).times(cifMaterial?.costo || 12).times(multiplier);
                          calculations.push(
                            <li key={`cif-${index}`}>
                              CIF: {fd.cif} × ${cifMaterial?.costo || 12} × {multiplier} = ${cost.toFixed(2)}
                            </li>
                          );
                        }
                        
                        // Calculate component values for detailed breakdown
                        let componentTotals = [];
                        let runningTotal = new Decimal(0);
                        
                        if (fd.mat_huacal && materialsData.matHuacal) {
                          const cost = new Decimal(fd.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier);
                          componentTotals.push({ name: "Material Huacal", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.mat_vista && materialsData.matVista) {
                          const cost = new Decimal(fd.mat_vista).times(materialsData.matVista.costo).times(multiplier);
                          componentTotals.push({ name: "Material Vista", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.chap_huacal && materialsData.chapHuacal) {
                          const cost = new Decimal(fd.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier);
                          componentTotals.push({ name: "Chapacinta Huacal", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.chap_vista && materialsData.chapVista) {
                          const cost = new Decimal(fd.chap_vista).times(materialsData.chapVista.costo).times(multiplier);
                          componentTotals.push({ name: "Chapacinta Vista", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.jaladera && materialsData.jaladera) {
                          const cost = new Decimal(fd.jaladera).times(materialsData.jaladera.costo).times(multiplier);
                          componentTotals.push({ name: "Jaladera", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.corredera && materialsData.corredera) {
                          const cost = new Decimal(fd.corredera).times(materialsData.corredera.costo).times(multiplier);
                          componentTotals.push({ name: "Corredera", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.bisagras && materialsData.bisagra) {
                          const cost = new Decimal(fd.bisagras).times(materialsData.bisagra.costo).times(multiplier);
                          componentTotals.push({ name: "Bisagras", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.patas && fd.patas > 0) {
                          const patasMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('pata') || 
                            acc.categoria.toLowerCase().includes('pata')
                          );
                          const cost = new Decimal(fd.patas || 0).times(patasMaterial?.costo || 15).times(multiplier);
                          componentTotals.push({ name: "Patas", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.clip_patas && fd.clip_patas > 0) {
                          const clipMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('clip') || 
                            acc.categoria.toLowerCase().includes('clip')
                          );
                          const cost = new Decimal(fd.clip_patas || 0).times(clipMaterial?.costo || 5).times(multiplier);
                          componentTotals.push({ name: "Clip Patas", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.mensulas && fd.mensulas > 0) {
                          const mensulasMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('mensul') || 
                            acc.categoria.toLowerCase().includes('mensul')
                          );
                          const cost = new Decimal(fd.mensulas || 0).times(mensulasMaterial?.costo || 8).times(multiplier);
                          componentTotals.push({ name: "Ménsulas", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.kit_tornillo && fd.kit_tornillo > 0) {
                          const kitTornilloMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('tornillo') || 
                            acc.categoria.toLowerCase().includes('tornillo')
                          );
                          const cost = new Decimal(fd.kit_tornillo || 0).times(kitTornilloMaterial?.costo || 10).times(multiplier);
                          componentTotals.push({ name: "Kit Tornillo", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        if (fd.cif && fd.cif > 0) {
                          const cifMaterial = accesoriosList.find(acc => 
                            acc.accesorios.toLowerCase().includes('cif') || 
                            acc.categoria.toLowerCase().includes('cif')
                          );
                          const cost = new Decimal(fd.cif || 0).times(cifMaterial?.costo || 12).times(multiplier);
                          componentTotals.push({ name: "CIF", value: cost });
                          runningTotal = runningTotal.plus(cost);
                        }
                        
                        return (
                          <div key={index} className="mb-3 p-2 bg-white rounded border border-gray-200">
                            <p className="font-semibold">
                              Mueble {index + 1}: {item.description || "Sin nombre"} (Área: {item.area || "N/A"})
                            </p>
                            <p className="text-xs text-gray-500 mb-1">Datos del mueble: Puertas: {fd.puertas || 0}, Cajones: {fd.cajones || 0}, Entrepaños: {fd.entrepaños || 0}</p>
                            {calculations.length > 0 ? (
                              <>
                                <ul className="pl-4 space-y-1 list-disc mt-1">
                                  {calculations}
                                </ul>
                                
                                {/* Detailed sum breakdown */}
                                <div className="mt-4 p-2 bg-gray-50 rounded border border-gray-200">
                                  <p className="font-semibold text-xs mb-2">Suma detallada de componentes:</p>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-300">
                                        <th className="text-left pb-1">Componente</th>
                                        <th className="text-right pb-1">Valor</th>
                                        <th className="text-right pb-1">Suma Acumulada</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {componentTotals.map((component, i) => {
                                        const cumulativeSum = componentTotals
                                          .slice(0, i + 1)
                                          .reduce((sum, curr) => sum.plus(curr.value), new Decimal(0));
                                          
                                        return (
                                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                            <td className="py-1">{component.name}</td>
                                            <td className="text-right py-1">${component.value.toFixed(2)}</td>
                                            <td className="text-right py-1 font-semibold">${cumulativeSum.toFixed(2)}</td>
                                          </tr>
                                        );
                                      })}
                                      <tr className="border-t border-gray-300 font-bold">
                                        <td className="pt-1">TOTAL</td>
                                        <td className="text-right pt-1" colSpan={2}>${runningTotal.toFixed(2)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                
                                <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-200">
                                  <div>
                                    <p className="font-bold text-blue-700">
                                      Precio Unitario: ${item.unitPrice}
                                    </p>
                                    <p className="font-bold text-blue-700">
                                      Subtotal: {item.quantity} × ${item.unitPrice} = ${new Decimal(item.quantity || 0).times(item.unitPrice || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    {item.unitPrice !== runningTotal.toDecimalPlaces(2).toNumber() && (
                                      <div className="text-red-500 font-bold text-sm bg-red-50 p-1 rounded">
                                        ¡Diferencia detectada!
                                        <br />
                                        Calculado: ${runningTotal.toFixed(2)}
                                        <br />
                                        Guardado: ${item.unitPrice}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className="italic text-gray-500">No hay materiales asignados a este mueble</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    * Esta sección solo muestra información para debugging y no afecta los cálculos reales.
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium">Productos y servicios</h3>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1 h-10"
                    onClick={() => {
                      const newIndex = fields.length;
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
                        position: newIndex,
                        type: "",
                        furnitureData: undefined,
                      });
                      // Clear the row inventory for this new index
                      const newRowInventory = { ...rowInventory };
                      newRowInventory[newIndex] = {
                        items: [],
                        hasMore: false,
                        page: 1,
                        searchQuery: '',
                        selectedType: ''
                      };
                      setRowInventory(newRowInventory);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Producto
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <tr>
                        <TableHead className="w-[90px] bg-muted/30 py-2 px-2 text-xs">Área</TableHead>
                        <TableHead className="w-[130px] bg-muted/30 py-2 px-2 text-xs">Tipo mueble</TableHead>
                        <TableHead className="w-[220px] bg-muted/30 py-2 px-2 text-xs">Mueble</TableHead>
                        <TableHead className="w-[60px] text-center bg-muted/30 py-2 px-2 text-xs">Cant.</TableHead>
                        <TableHead className="w-[70px] text-center bg-muted/30 py-2 px-2 text-xs">Cajones</TableHead>
                        <TableHead className="w-[70px] text-center bg-muted/30 py-2 px-2 text-xs">Puertas</TableHead>
                        <TableHead className="w-[70px] text-center bg-muted/30 py-2 px-2 text-xs">Entre.</TableHead>
                        <TableHead className="w-[90px] text-right bg-muted/30 py-2 px-2 text-xs">Precio (auto)</TableHead>
                        <TableHead className="w-[90px] text-right bg-muted/30 py-2 px-2 text-xs">Total</TableHead>
                        <TableHead className="w-[40px] bg-muted/30 py-2 px-2 text-xs"></TableHead>
                      </tr>
                    </TableHeader>
                    <tbody>
                      {fields.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="h-24 text-center text-muted-foreground">
                            No hay productos agregados aún
                          </td>
                        </tr>
                      ) : (
                        fields.map((field, index) => (
                          <tr key={field.id} className={index % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                            <td className="py-2 px-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.area`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Área"
                                        className="h-8 px-2 text-sm"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.type`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <CustomCombobox
                                        options={furnitureTypes.map(type => ({
                                          label: type,
                                          value: type,
                                          data: type
                                        }))}
                                        value={field.value || ''}
                                        onChange={(value) => {
                                          field.onChange(value);
                                          // When the type changes, filter the inventory
                                          searchInventoryItems('', value, index);
                                          // Clear the current furniture selection
                                          form.setValue(`items.${index}.description`, '');
                                          // Reset the furniture-related fields
                                          form.setValue(`items.${index}.drawers`, 0);
                                          form.setValue(`items.${index}.doors`, 0);
                                          form.setValue(`items.${index}.shelves`, 0);
                                          form.setValue(`items.${index}.unitPrice`, 0);
                                          form.setValue(`items.${index}.furnitureData`, undefined);
                                        }}
                                        placeholder={isLoadingFurnitureTypes ? "Cargando..." : "Seleccionar tipo"}
                                        disabled={isLoadingFurnitureTypes}
                                        popoverWidth={200}
                                        className="h-8 w-full text-sm"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <CustomCombobox
                                        options={(rowInventory[index]?.items || []).map((item) => ({
                                          label: item.nombre_mueble,
                                          value: item.nombre_mueble,
                                          data: item
                                        }))}
                                        value={field.value || ''}
                                        onChange={(value) => {
                                          field.onChange(value);
                                          
                                          if (!value) {
                                            // Reset furniture data if no selection
                                            form.setValue(`items.${index}.furnitureData`, undefined);
                                            return;
                                          }
                                          
                                          // Find the selected inventory item
                                          const selectedItem = (rowInventory[index]?.items || []).find(item => 
                                            item.nombre_mueble === value
                                          );
                                          
                                          if (selectedItem) {
                                            // Store furniture data for price calculation
                                            form.setValue(`items.${index}.furnitureData`, {
                                              mueble_id: selectedItem.mueble_id,
                                              cajones: selectedItem.cajones,
                                              puertas: selectedItem.puertas,
                                              entrepaños: selectedItem.entrepaños,
                                              mat_huacal: selectedItem.mat_huacal,
                                              mat_vista: selectedItem.mat_vista,
                                              chap_huacal: selectedItem.chap_huacal,
                                              chap_vista: selectedItem.chap_vista,
                                              jaladera: selectedItem.jaladera,
                                              corredera: selectedItem.corredera,
                                              bisagras: selectedItem.bisagras,
                                              patas: selectedItem.patas,
                                              clip_patas: selectedItem.clip_patas,
                                              mensulas: selectedItem.mensulas,
                                              kit_tornillo: selectedItem.kit_tornillo,
                                              cif: selectedItem.cif
                                            });
                                            console.log(`Stored furniture data for item ${index}:`, selectedItem);
                                            
                                            // Update form details from the selected item
                                            form.setValue(`items.${index}.description`, selectedItem.nombre_mueble);
                                            
                                            // Set default quantity to 1 if it's not set
                                            if (!form.getValues(`items.${index}.quantity`)) {
                                              form.setValue(`items.${index}.quantity`, 1);
                                            }
                                            
                                            // Auto-calculate the price based on materials and project type
                                            console.log(`Calculating price for item ${index} after furniture selection`);
                                            
                                            // Calculate price consistently - force immediate calculation
                                            const projectType = form.getValues('projectType');
                                            const materialsData = form.getValues('materialsData') || {};
                                            
                                            // Skip if no project type
                                            if (!projectType) {
                                              console.warn("No project type selected, skipping price calculation");
                                              return;
                                            }
                                            
                                            // Determine multiplier
                                            let multiplier = 1;
                                            if (projectType === "1") multiplier = 1.8;
                                            else if (projectType === "3") multiplier = 1.5;
                                            
                                            console.log(`Using multiplier: ${multiplier} for project type: ${projectType}`);
                                            
                                            // Get furniture data
                                            const fd = form.getValues(`items.${index}.furnitureData`);
                                            if (!fd) {
                                              console.warn("No furniture data available, skipping price calculation");
                                              return;
                                            }
                                            
                                            // Initialize total price with Decimal for better precision
                                            let totalPrice = new Decimal(0);
                                            
                                            // Calculate component costs with detailed logging
                                            let componentLog = [];
                                            
                                            // Calculations for base materials
                                            if (fd.mat_huacal && materialsData.matHuacal) {
                                              const cost = new Decimal(fd.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`mat_huacal: ${fd.mat_huacal} * ${materialsData.matHuacal.costo} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.mat_vista && materialsData.matVista) {
                                              const cost = new Decimal(fd.mat_vista).times(materialsData.matVista.costo).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`mat_vista: ${fd.mat_vista} * ${materialsData.matVista.costo} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.chap_huacal && materialsData.chapHuacal) {
                                              const cost = new Decimal(fd.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`chap_huacal: ${fd.chap_huacal} * ${materialsData.chapHuacal.costo} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.chap_vista && materialsData.chapVista) {
                                              const cost = new Decimal(fd.chap_vista).times(materialsData.chapVista.costo).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`chap_vista: ${fd.chap_vista} * ${materialsData.chapVista.costo} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.jaladera && materialsData.jaladera) {
                                              const cost = new Decimal(fd.jaladera).times(materialsData.jaladera.costo).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`jaladera: ${fd.jaladera} * ${materialsData.jaladera.costo} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.corredera && materialsData.corredera) {
                                              const cost = new Decimal(fd.corredera).times(materialsData.corredera.costo).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`corredera: ${fd.corredera} * ${materialsData.corredera.costo} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.bisagras && materialsData.bisagra) {
                                              const cost = new Decimal(fd.bisagras).times(materialsData.bisagra.costo).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`bisagras: ${fd.bisagras} * ${materialsData.bisagra.costo} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            // Direct accessory calculations
                                            if (fd.patas && fd.patas > 0) {
                                              const patasMaterial = findAccessory({ name: 'patas', category: 'patas' });
                                              const cost = new Decimal(fd.patas).times(patasMaterial?.costo || 15).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`patas: ${fd.patas} * ${patasMaterial?.costo || 15} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.clip_patas && fd.clip_patas > 0) {
                                              const clipMaterial = findAccessory({ name: 'clip_patas', category: 'clip patas' });
                                              const cost = new Decimal(fd.clip_patas).times(clipMaterial?.costo || 5).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`clip_patas: ${fd.clip_patas} * ${clipMaterial?.costo || 5} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.mensulas && fd.mensulas > 0) {
                                              const mensulasMaterial = findAccessory({ name: 'mensulas', category: 'mensulas' });
                                              const cost = new Decimal(fd.mensulas).times(mensulasMaterial?.costo || 8).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`mensulas: ${fd.mensulas} * ${mensulasMaterial?.costo || 8} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.kit_tornillo && fd.kit_tornillo > 0) {
                                              const kitMaterial = findAccessory({ name: 'kit_tornillo', category: 'kit tornillo' });
                                              const cost = new Decimal(fd.kit_tornillo).times(kitMaterial?.costo || 10).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`kit_tornillo: ${fd.kit_tornillo} * ${kitMaterial?.costo || 10} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            if (fd.cif && fd.cif > 0) {
                                              const cifMaterial = findAccessory({ name: 'cif', category: 'cif' });
                                              const cost = new Decimal(fd.cif).times(cifMaterial?.costo || 12).times(multiplier);
                                              totalPrice = totalPrice.plus(cost);
                                              componentLog.push(`cif: ${fd.cif} * ${cifMaterial?.costo || 12} * ${multiplier} = ${cost}`);
                                            }
                                            
                                            // Generate a summary of all component costs for debugging
                                            console.log("Price components for item", index);
                                            componentLog.forEach(log => console.log(`- ${log}`));
                                            console.log("Total calculated price before rounding:", totalPrice.toString());
                                            
                                            // Convert to number with precise decimal places
                                            const finalPrice = totalPrice.toDecimalPlaces(2).toNumber();
                                            console.log(`Final calculated price for item ${index}: ${finalPrice}`);
                                            
                                            // IMPORTANT: Directly update the unit price
                                            form.setValue(`items.${index}.unitPrice`, finalPrice);
                                            
                                            // Force refresh calculations
                                            setTimeout(() => {
                                              debugCalculationMismatch();
                                            }, 100);
                                          }
                                        }}
                                        onSearch={(searchText) => {
                                          // Pass the current type filter along with the search text
                                          const typeFilter = form.watch(`items.${index}.type`);
                                          searchInventoryItems(searchText, typeFilter, index);
                                        }}
                                        onLoadMore={() => loadMoreInventoryItems(index)}
                                        hasMore={rowInventory[index]?.hasMore || false}
                                        placeholder={isLoadingInventory ? "Cargando..." : "Seleccionar mueble"}
                                        disabled={isLoadingInventory || !form.watch(`items.${index}.type`)}
                                        popoverWidth={320}
                                        className="h-8 w-full text-sm"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-2">
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
                                        className="h-8 text-center px-2 text-sm"
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-2">
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
                                        className="h-8 text-center px-2 text-sm bg-muted/10"
                                        readOnly
                                        disabled
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-2">
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
                                        className="h-8 text-center px-2 text-sm bg-muted/10"
                                        readOnly
                                        disabled
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-2">
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
                                        className="h-8 text-center px-2 text-sm bg-muted/10"
                                        readOnly
                                        disabled
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <div className="text-sm font-medium">
                                {formatCurrencyDisplay(new Decimal(form.watch(`items.${index}.unitPrice`) || 0))}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-sm">
                              {(() => {
                                const quantity = new Decimal(form.watch(`items.${index}.quantity`) || 0);
                                const unitPrice = new Decimal(form.watch(`items.${index}.unitPrice`) || 0);
                                const subtotal = quantity.mul(unitPrice);
                                
                                return formatCurrencyDisplay(subtotal);
                              })()}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  // Remove the row from the form
                                  remove(index);
                                  
                                  // Clean up the row inventory
                                  const newRowInventory = { ...rowInventory };
                                  delete newRowInventory[index];
                                  setRowInventory(newRowInventory);
                                }}
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
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(calculateProgress())}% completado
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