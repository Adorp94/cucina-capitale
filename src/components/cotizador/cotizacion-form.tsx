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
    chapHuacal: materialDataSchema,
    matVista: materialDataSchema,
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
    // Add positions if not present to avoid type errors and ensure description is there
    const itemsWithPosition = items.map((item, index) => ({
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
  }, [form.watch("items")]);

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
      
      // Determine the multiplier based on project type
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
      
      // Initialize total price
      let totalPrice = 0;
      
      // Calculate mat_huacal cost
      if (furnitureData.mat_huacal && materialsData.matHuacal) {
        const matHuacalCost = furnitureData.mat_huacal * materialsData.matHuacal.costo * multiplier;
        console.log(`mat_huacal: ${furnitureData.mat_huacal} * ${materialsData.matHuacal.costo} * ${multiplier} = ${matHuacalCost}`);
        totalPrice += matHuacalCost;
      }
      
      // Calculate mat_vista cost
      if (furnitureData.mat_vista && materialsData.matVista) {
        const matVistaCost = furnitureData.mat_vista * materialsData.matVista.costo * multiplier;
        console.log(`mat_vista: ${furnitureData.mat_vista} * ${materialsData.matVista.costo} * ${multiplier} = ${matVistaCost}`);
        totalPrice += matVistaCost;
      }
      
      // Calculate chap_huacal cost
      if (furnitureData.chap_huacal && materialsData.chapHuacal) {
        const chapHuacalCost = furnitureData.chap_huacal * materialsData.chapHuacal.costo * multiplier;
        console.log(`chap_huacal: ${furnitureData.chap_huacal} * ${materialsData.chapHuacal.costo} * ${multiplier} = ${chapHuacalCost}`);
        totalPrice += chapHuacalCost;
      }
      
      // Calculate chap_vista cost
      if (furnitureData.chap_vista && materialsData.chapVista) {
        const chapVistaCost = furnitureData.chap_vista * materialsData.chapVista.costo * multiplier;
        console.log(`chap_vista: ${furnitureData.chap_vista} * ${materialsData.chapVista.costo} * ${multiplier} = ${chapVistaCost}`);
        totalPrice += chapVistaCost;
      }
      
      // Calculate jaladera cost
      if (furnitureData.jaladera && materialsData.jaladera) {
        const jaladeraCost = furnitureData.jaladera * materialsData.jaladera.costo * multiplier;
        console.log(`jaladera: ${furnitureData.jaladera} * ${materialsData.jaladera.costo} * ${multiplier} = ${jaladeraCost}`);
        totalPrice += jaladeraCost;
      }
      
      // Calculate corredera cost
      if (furnitureData.corredera && materialsData.corredera) {
        const correderaCost = furnitureData.corredera * materialsData.corredera.costo * multiplier;
        console.log(`corredera: ${furnitureData.corredera} * ${materialsData.corredera.costo} * ${multiplier} = ${correderaCost}`);
        totalPrice += correderaCost;
      }
      
      // Calculate bisagras cost
      if (furnitureData.bisagras && materialsData.bisagra) {
        const bisagrasCost = furnitureData.bisagras * materialsData.bisagra.costo * multiplier;
        console.log(`bisagras: ${furnitureData.bisagras} * ${materialsData.bisagra.costo} * ${multiplier} = ${bisagrasCost}`);
        totalPrice += bisagrasCost;
      }
      
      // Calculate accessories costs using the new accesorios table
      
      // Calculate patas cost
      if (furnitureData.patas && furnitureData.patas > 0) {
        const patasMaterial = findAccessory({ name: 'patas', category: 'patas' });
        
        if (patasMaterial) {
          const patasCost = furnitureData.patas * patasMaterial.costo * multiplier;
          console.log(`patas: ${furnitureData.patas} * ${patasMaterial.costo} * ${multiplier} = ${patasCost}`);
          totalPrice += patasCost;
        } else {
          // Fallback if material not found
          const defaultPatasCost = 15; // Default cost if not found
          const patasCost = furnitureData.patas * defaultPatasCost * multiplier;
          console.log(`patas (default cost): ${furnitureData.patas} * ${defaultPatasCost} * ${multiplier} = ${patasCost}`);
          totalPrice += patasCost;
        }
      }
      
      // Calculate clip_patas cost
      if (furnitureData.clip_patas && furnitureData.clip_patas > 0) {
        const clipPatasMaterial = findAccessory({ name: 'clip_patas', category: 'clip patas' });
        
        if (clipPatasMaterial) {
          const clipPatasCost = furnitureData.clip_patas * clipPatasMaterial.costo * multiplier;
          console.log(`clip_patas: ${furnitureData.clip_patas} * ${clipPatasMaterial.costo} * ${multiplier} = ${clipPatasCost}`);
          totalPrice += clipPatasCost;
        } else {
          // Fallback if material not found
          const defaultClipPatasCost = 5; // Default cost if not found
          const clipPatasCost = furnitureData.clip_patas * defaultClipPatasCost * multiplier;
          console.log(`clip_patas (default cost): ${furnitureData.clip_patas} * ${defaultClipPatasCost} * ${multiplier} = ${clipPatasCost}`);
          totalPrice += clipPatasCost;
        }
      }
      
      // Calculate mensulas cost
      if (furnitureData.mensulas && furnitureData.mensulas > 0) {
        const mensulasMaterial = findAccessory({ name: 'mensulas', category: 'mensulas' });
        
        if (mensulasMaterial) {
          const mensulasCost = furnitureData.mensulas * mensulasMaterial.costo * multiplier;
          console.log(`mensulas: ${furnitureData.mensulas} * ${mensulasMaterial.costo} * ${multiplier} = ${mensulasCost}`);
          totalPrice += mensulasCost;
        } else {
          // Fallback if material not found
          const defaultMensulasCost = 8; // Default cost if not found
          const mensulasCost = furnitureData.mensulas * defaultMensulasCost * multiplier;
          console.log(`mensulas (default cost): ${furnitureData.mensulas} * ${defaultMensulasCost} * ${multiplier} = ${mensulasCost}`);
          totalPrice += mensulasCost;
        }
      }
      
      // Calculate kit_tornillo cost
      if (furnitureData.kit_tornillo && furnitureData.kit_tornillo > 0) {
        const kitTornilloMaterial = findAccessory({ name: 'kit_tornillo', category: 'kit tornillo' });
        
        if (kitTornilloMaterial) {
          const kitTornilloCost = furnitureData.kit_tornillo * kitTornilloMaterial.costo * multiplier;
          console.log(`kit_tornillo: ${furnitureData.kit_tornillo} * ${kitTornilloMaterial.costo} * ${multiplier} = ${kitTornilloCost}`);
          totalPrice += kitTornilloCost;
        } else {
          // Fallback if material not found
          const defaultKitTornilloCost = 10; // Default cost if not found
          const kitTornilloCost = furnitureData.kit_tornillo * defaultKitTornilloCost * multiplier;
          console.log(`kit_tornillo (default cost): ${furnitureData.kit_tornillo} * ${defaultKitTornilloCost} * ${multiplier} = ${kitTornilloCost}`);
          totalPrice += kitTornilloCost;
        }
      }
      
      // Calculate cif cost
      if (furnitureData.cif && furnitureData.cif > 0) {
        const cifMaterial = findAccessory({ name: 'cif', category: 'cif' });
        
        if (cifMaterial) {
          const cifCost = furnitureData.cif * cifMaterial.costo * multiplier;
          console.log(`cif: ${furnitureData.cif} * ${cifMaterial.costo} * ${multiplier} = ${cifCost}`);
          totalPrice += cifCost;
        } else {
          // Fallback if material not found
          const defaultCifCost = 12; // Default cost if not found
          const cifCost = furnitureData.cif * defaultCifCost * multiplier;
          console.log(`cif (default cost): ${furnitureData.cif} * ${defaultCifCost} * ${multiplier} = ${cifCost}`);
          totalPrice += cifCost;
        }
      }
      
      // Generate a summary of all component costs for debugging
      console.log("Price breakdown summary:");
      if (furnitureData.mat_huacal && materialsData.matHuacal) {
        console.log(`- Material Huacal: $${(furnitureData.mat_huacal * materialsData.matHuacal.costo * multiplier).toFixed(2)}`);
      }
      if (furnitureData.mat_vista && materialsData.matVista) {
        console.log(`- Material Vista: $${(furnitureData.mat_vista * materialsData.matVista.costo * multiplier).toFixed(2)}`);
      }
      if (furnitureData.chap_huacal && materialsData.chapHuacal) {
        console.log(`- Chapacinta Huacal: $${(furnitureData.chap_huacal * materialsData.chapHuacal.costo * multiplier).toFixed(2)}`);
      }
      if (furnitureData.chap_vista && materialsData.chapVista) {
        console.log(`- Chapacinta Vista: $${(furnitureData.chap_vista * materialsData.chapVista.costo * multiplier).toFixed(2)}`);
      }
      if (furnitureData.jaladera && materialsData.jaladera) {
        console.log(`- Jaladera: $${(furnitureData.jaladera * materialsData.jaladera.costo * multiplier).toFixed(2)}`);
      }
      if (furnitureData.corredera && materialsData.corredera) {
        console.log(`- Corredera: $${(furnitureData.corredera * materialsData.corredera.costo * multiplier).toFixed(2)}`);
      }
      if (furnitureData.bisagras && materialsData.bisagra) {
        console.log(`- Bisagras: $${(furnitureData.bisagras * materialsData.bisagra.costo * multiplier).toFixed(2)}`);
      }
      
      // Round to 2 decimal places
      totalPrice = Math.round(totalPrice * 100) / 100;
      console.log(`Total calculated price for item ${index}: ${totalPrice}`);
      
      // Update the unitPrice field
      form.setValue(`items.${index}.unitPrice`, totalPrice);
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
                                
                                // Price updates happen automatically via useEffect
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
                                
                                // Price updates happen automatically via useEffect
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
                                
                                // Price updates happen automatically via useEffect
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
                                
                                // Price updates happen automatically via useEffect
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
                                
                                // Price updates happen automatically via useEffect
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
                                
                                // Price updates happen automatically via useEffect
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
                                
                                // Price updates happen automatically via useEffect
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
                        <TableHead className="w-[90px] text-right bg-muted/30 py-2 px-2 text-xs">Precio</TableHead>
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
                                        options={(rowInventory[index]?.items ?? inventoryItems).map((item: any) => ({
                                          label: item.nombre_mueble,
                                          value: item.nombre_mueble,
                                          data: item
                                        }))}
                                        value={field.value || ''}
                                        onChange={(value) => {
                                          field.onChange(value);
                                          // Find the selected inventory item
                                          const selectedItem = (rowInventory[index]?.items ?? inventoryItems).find((item: any) => 
                                            item.nombre_mueble === value
                                          );
                                          if (selectedItem) {
                                            // Update furniture data
                                            const furnitureData = {
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
                                            };
                                            
                                            console.log(`Storing furniture data for row ${index}:`, furnitureData);
                                            form.setValue(`items.${index}.furnitureData`, furnitureData);
                                            
                                            // Update the furniture details
                                            form.setValue(`items.${index}.drawers`, selectedItem.cajones || 0);
                                            form.setValue(`items.${index}.doors`, selectedItem.puertas || 0);
                                            form.setValue(`items.${index}.shelves`, selectedItem.entrepaños || 0);
                                            
                                            // Calculate price based on materials and project type
                                            calculateItemPrice(index, furnitureData);
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
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unitPrice`}
                                  render={({ field }) => (
                                    <FormItem className="mb-0 flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="text"
                                          placeholder="$0.00"
                                          className="h-8 text-right px-2 text-sm"
                                          readOnly
                                          value={`$${formatCurrencyDisplay(new Decimal(field.value || 0))}`}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                  onClick={() => {
                                    const furnitureData = form.getValues(`items.${index}.furnitureData`);
                                    if (furnitureData) {
                                      calculateItemPrice(index, furnitureData);
                                    }
                                  }}
                                  title="Calcular precio"
                                >
                                  <Calculator className="h-3.5 w-3.5" />
                                </Button>
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