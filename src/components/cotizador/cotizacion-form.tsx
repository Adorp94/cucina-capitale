'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';
import { 
  Plus, X, ChevronRight, Edit2, PenTool, Trash2, 
  ChevronDown, ChevronUp, CalendarIcon, ArrowUp, Check, 
  Loader2, Search, Calculator, FileText, ArrowLeft,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { createBrowserClient } from '@supabase/ssr';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  clientId: z.number().min(1, { message: "Cliente requerido" }),
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
  onSave: (clientData: { id: number; nombre: string; correo?: string; celular?: string; direccion?: string }) => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form for the new client
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
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Insert the new client
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
      
      if (error) throw error;
      
      // Call onSave with the new client data
      onSave({
        id: Number(newClient.id_cliente),
        nombre: newClient.nombre,
        correo: newClient.correo,
        celular: newClient.celular,
        direccion: newClient.direccion
      });
      
      // Close the modal
      onClose();
      
      // Show success message
      toast({
        title: "Cliente guardado",
        description: "El cliente ha sido creado exitosamente.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: "Hubo un error al guardar el cliente. Por favor intente de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingrese los datos del nuevo cliente
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={clientForm.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={clientForm.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
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
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cliente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main component
export default function CotizacionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // State for form and UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("cotizacion");
  const [currentSection, setCurrentSection] = useState<string>("cliente-proyecto");
  const [clients, setClients] = useState<Array<{id: number; name: string; email: string | null; phone: string | null; address: string | null}>>([]);
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
  
  // Add this new state for PDF download
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues: {
      clientId: 0,
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

  // Make fetchMaterials and fetchAccesorios into useCallback functions
  const fetchMaterials = useCallback(async () => {
    setIsLoadingMaterials(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
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
  }, []);

  // Fetch clients from Supabase on mount
  useEffect(() => {
    fetchClients();
  }, []);
  
  // Fetch clients from database
  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase
        .from('clientes')
        .select('id_cliente, nombre, correo, celular, direccion')
        .order('nombre', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      // Format the data to match our UI needs
      const formattedClients = data.map(client => ({
        id: Number(client.id_cliente),
        name: client.nombre,
        email: client.correo,
        phone: client.celular,
        address: client.direccion
      }));
      
      setClients(formattedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Update mock data to use numbers
      setClients([
        { id: 1, name: "Cliente Ejemplo 1", email: "cliente1@example.com", phone: "123-456-7890", address: "Dirección Ejemplo 1" },
        { id: 2, name: "Cliente Ejemplo 2", email: "cliente2@example.com", phone: "098-765-4321", address: "Dirección Ejemplo 2" },
        { id: 3, name: "Cliente Ejemplo 3", email: "cliente3@example.com", phone: "555-555-5555", address: "Dirección Ejemplo 3" },
      ]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Handle new client creation from modal
  const handleNewClient = (clientData: { id: number; nombre: string; correo?: string; celular?: string; direccion?: string }) => {
    const newClient = {
      id: clientData.id,
      name: clientData.nombre,
      email: clientData.correo || null,
      phone: clientData.celular || null,
      address: clientData.direccion || null
    };
    
    // Add to clients list
    setClients(prevClients => [newClient, ...prevClients]);
    
    // Select the new client
    form.setValue("clientId", newClient.id);
    form.setValue("clientName", newClient.name);
    form.setValue("clientEmail", newClient.email || "");
    form.setValue("clientPhone", newClient.phone || "");
    form.setValue("clientAddress", newClient.address || "");
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
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
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

  // Add function to fetch inventory items 
  const fetchInventory = useCallback(async (
    searchQuery = '', 
    selectedType = '', 
    rowIndex: number | null = null,
    page = 1,
    append = false
  ) => {
    try {
      const PAGE_SIZE = 20;
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Build the base query
      let query = supabase
        .from('inventario')
        .select('*', { count: 'exact' });

      // Add type filter if specified
      if (selectedType) {
        query = query.eq('tipo', selectedType);
      }

      // Add search filter
      if (searchQuery && searchQuery.length >= 2) {
        query = query.ilike('nombre_mueble', `%${searchQuery}%`);
      }

      // Add pagination and ordering
      query = query.range(from, to).order('nombre_mueble');
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching inventory items:', error);
        return;
      }
      
      // Update row inventory if specified
      if (rowIndex !== null) {
        const newRowInventory = { ...rowInventory };
        if (!append) {
          newRowInventory[rowIndex] = {
            items: data || [],
            hasMore: data?.length === PAGE_SIZE,
            page,
            searchQuery,
            selectedType
          };
        } else {
          // Append items for infinite scrolling
          if (newRowInventory[rowIndex]) {
            newRowInventory[rowIndex] = {
              ...newRowInventory[rowIndex],
              items: [...newRowInventory[rowIndex].items, ...(data || [])],
              hasMore: data?.length === PAGE_SIZE,
              page
            };
          }
        }
        setRowInventory(newRowInventory);
      } else {
        if (append) {
          setInventoryItems(prev => [...prev, ...(data || [])]);
        } else {
          setInventoryItems(data || []);
        }
      }
    } catch (error) {
      console.error('Error in fetchInventory:', error);
    }
  }, [rowInventory]);

  // Create simple functions for searching and loading more
  const searchInventoryItems = (searchQuery: string, selectedType: string = '', rowIndex: number | null = null) => {
    fetchInventory(searchQuery, selectedType, rowIndex, 1, false);
  };
  
  const loadMoreInventoryItems = (rowIndex: number | null = null) => {
    if (rowIndex !== null && rowInventory[rowIndex]) {
      const { page, searchQuery, selectedType } = rowInventory[rowIndex];
      fetchInventory(searchQuery, selectedType, rowIndex, page + 1, true);
    } else {
      fetchInventory('', currentTypeFilter, null, 2, true);
    }
  };

  // Add function to fetch materials by type directly from the database
  const fetchMaterialsByType = async (tipo: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
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

  // Fetch accessories from database
  const fetchAccesorios = useCallback(async () => {
    setIsLoadingAccesorios(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase
        .from('accesorios')
        .select('id_accesorios, accesorios, costo, categoria, comentario')
        .order('categoria', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setAccesoriosList(data);
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los accesorios",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAccesorios(false);
    }
  }, [toast]);

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
  }, [fetchMaterials, fetchMaterialsByType, fetchAccesorios, fetchInventory, fetchFurnitureTypes]);

  // Recalculate totals whenever form items change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.startsWith('items')) {
        const items = form.getValues("items") || [];
        // Add positions if not present to avoid type errors and ensure description is there
        const itemsWithPosition = items.map((item, index) => ({
          ...item,
          position: index,
          description: item.description || `Item ${index + 1}`, // Ensure description exists
          quantity: item.quantity || 1, // Ensure quantity exists
          unitPrice: item.unitPrice || 0 // Ensure unitPrice exists
        }));
        
        try {
          // Calculate subtotal by summing up each item's total (quantity * unitPrice)
          const subtotal = itemsWithPosition.reduce((acc, item) => {
            const itemTotal = new Decimal(item.quantity || 0).mul(new Decimal(item.unitPrice || 0));
            return acc.plus(itemTotal);
          }, new Decimal(0));

          // Calculate taxes
          const taxes = subtotal.mul(new Decimal(DEFAULT_COTIZADOR_CONFIG.taxRate).div(100));
          
          // Calculate total
          const total = subtotal.plus(taxes);
          
          // Update totals state
          setTotals({
            subtotal,
            taxes,
            total
          });
        } catch (error) {
          console.error("Error calculating totals:", error);
        }
      }
    });

    // Initial calculation
    const items = form.getValues("items") || [];
    const itemsWithPosition = items.map((item, index) => ({
      ...item,
      position: index,
      description: item.description || `Item ${index + 1}`,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0
    }));
    
    try {
      const subtotal = itemsWithPosition.reduce((acc, item) => {
        const itemTotal = new Decimal(item.quantity || 0).mul(new Decimal(item.unitPrice || 0));
        return acc.plus(itemTotal);
      }, new Decimal(0));

      const taxes = subtotal.mul(new Decimal(DEFAULT_COTIZADOR_CONFIG.taxRate).div(100));
      const total = subtotal.plus(taxes);
      
      setTotals({
        subtotal,
        taxes,
        total
      });
    } catch (error) {
      console.error("Error calculating initial totals:", error);
    }

    return () => subscription.unsubscribe();
  }, [form]); // Watch the entire form for changes

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
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Starting form submission with data:", data);
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity || 0), 0);
      const taxRate = 0.16;
      const taxes = subtotal * taxRate;
      const total = subtotal + taxes;

      console.log("Calculated totals:", { subtotal, taxRate, taxes, total });

      // Prepare quotation data
      const quotationData = {
        id_cliente: data.clientId,
        project_name: data.projectName,
        project_type: data.projectType,
        subtotal,
        tax_rate: taxRate,
        taxes,
        total,
        valid_until: data.validUntil,
        delivery_time: data.deliveryTime,
        notes: data.notes
      };

      console.log("Preparing to insert quotation data:", quotationData);

      // Initialize supabase client
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Insert quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('cotizaciones')
        .insert([quotationData])
        .select()
        .single();

      if (quotationError) {
        console.error("Error inserting quotation:", quotationError);
        toast({
          title: "Error",
          description: "No se pudo crear la cotización. Por favor, intente de nuevo.",
          variant: "destructive",
        });
        return;
      }

      // Insert quotation items
      const quotationItems = data.items.map((item, index) => ({
        id_cotizacion: quotation.id_cotizacion,
        mueble_id: item.furnitureData?.mueble_id || null,
        position: index,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity * (1 - item.discount / 100)
      }));

      const { error: itemsError } = await supabase
        .from('cotizacion_items')
        .insert(quotationItems);

      if (itemsError) {
        throw new Error(`Error al guardar los items: ${itemsError.message}`);
      }

      // Insert materials used
      if (data.materialsData) {
        const materialsToInsert = Object.entries(data.materialsData)
          .filter(([_, material]) => material && material.id_material)
          .map(([tipo, material]) => ({
            id_cotizacion: quotation.id_cotizacion,
            id_material: material.id_material,
            tipo: tipo,
            costo_usado: material.costo
          }));

        if (materialsToInsert.length > 0) {
          const { error: materialsError } = await supabase
            .from('cotizacion_materiales')
            .insert(materialsToInsert);

          if (materialsError) {
            throw new Error(`Error al guardar los materiales: ${materialsError.message}`);
          }
        }
      }

      toast({
        title: "Éxito",
        description: "Cotización generada correctamente",
      });
      
      // Ask user if they want to download the PDF
      const shouldDownloadPdf = window.confirm('¿Desea descargar la cotización en PDF?');
      if (shouldDownloadPdf) {
        await downloadPdf(quotation.id_cotizacion);
      }
      
      // Navigate to the edit page for this quotation
      router.push(`/cotizador/${quotation.id_cotizacion}`);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar la cotización. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
        
        console.log(`Calculating price for item ${index}`);
        
        // Calculate all material costs with the same logic everywhere
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
        
        // Calculate accessories costs
        if (fd.patas && fd.patas > 0) {
          const patasMaterial = findAccessory({ name: 'patas', category: 'patas' });
          const cost = patasMaterial ? patasMaterial.costo : 15;
          totalPrice = totalPrice.plus(new Decimal(fd.patas).times(cost).times(multiplier));
        }
        
        if (fd.clip_patas && fd.clip_patas > 0) {
          const clipMaterial = findAccessory({ name: 'clip_patas', category: 'clip patas' });
          const cost = clipMaterial ? clipMaterial.costo : 5;
          totalPrice = totalPrice.plus(new Decimal(fd.clip_patas).times(cost).times(multiplier));
        }
        
        if (fd.mensulas && fd.mensulas > 0) {
          const mensulasMaterial = findAccessory({ name: 'mensulas', category: 'mensulas' });
          const cost = mensulasMaterial ? mensulasMaterial.costo : 8;
          totalPrice = totalPrice.plus(new Decimal(fd.mensulas).times(cost).times(multiplier));
        }
        
        if (fd.kit_tornillo && fd.kit_tornillo > 0) {
          const kitMaterial = findAccessory({ name: 'kit_tornillo', category: 'kit tornillo' });
          const cost = kitMaterial ? kitMaterial.costo : 10;
          totalPrice = totalPrice.plus(new Decimal(fd.kit_tornillo).times(cost).times(multiplier));
        }
        
        if (fd.cif && fd.cif > 0) {
          const cifMaterial = findAccessory({ name: 'cif', category: 'cif' });
          const cost = cifMaterial ? cifMaterial.costo : 12;
          totalPrice = totalPrice.plus(new Decimal(fd.cif).times(cost).times(multiplier));
        }
        
        // Convert to number with precise decimal places
        const finalPrice = totalPrice.toDecimalPlaces(2).toNumber();
        console.log(`Final calculated price for item ${index}: ${finalPrice}`);
        
        // Store the calculated price in our temporary array
        updatedItems[index].unitPrice = finalPrice;
      }
      
      // Batch update all prices at once
      form.setValue('items', updatedItems);
      
      console.log("Completed recalculation of all prices");
    } catch (error) {
      console.error('Error recalculating prices:', error);
      toast({
        title: "Error de recálculo",
        description: "Ocurrió un error al recalcular los precios."
      });
    }
  };

  // Add this useEffect to make sure the updates are reflected in the UI
  useEffect(() => {
    // We specifically want to watch item prices to ensure they display correctly
    const subscription = form.watch((value: any, { name }: { name?: string }) => {
      if (name && name.includes('items') && name.includes('unitPrice')) {
        console.log(`Price updated for ${name}:`, value);
        
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
    // Find the selected inventory item based on nombre_mueble
    const selectedItem = rowInventory[index]?.items.find((item) => item.nombre_mueble === value);
    console.log("Selected item:", selectedItem);
    
    if (selectedItem) {
      // Store furniture data for price calculation
      const furnitureData = {
        mueble_id: selectedItem.mueble_id,
        mat_huacal: selectedItem.mat_huacal || null,
        mat_vista: selectedItem.mat_vista || null,
        chap_huacal: selectedItem.chap_huacal || null,
        chap_vista: selectedItem.chap_vista || null,
        jaladera: selectedItem.jaladera || null,
        corredera: selectedItem.corredera || null,
        bisagras: selectedItem.bisagras || null,
        patas: selectedItem.patas || null,
        clip_patas: selectedItem.clip_patas || null,
        mensulas: selectedItem.mensulas || null,
        kit_tornillo: selectedItem.kit_tornillo || null,
        cif: selectedItem.cif || null,
        cajones: 0,
        puertas: 0,
        entrepaños: 0
      };
      
      console.log("Stored furniture data:", furnitureData);
      
      // First update furniture details in the form
      form.setValue(`items.${index}.description`, selectedItem.nombre_mueble);
      form.setValue(`items.${index}.quantity`, form.getValues(`items.${index}.quantity`) || 1);
      form.setValue(`items.${index}.furnitureData`, furnitureData);
      
      // Now calculate the price based on materials and project type
      calculateItemPrice(index, furnitureData);
      
      // Debug to verify price calculation consistency
      debugCalculationMismatch();
    }
  };

  // Add this new function for PDF download
  const downloadPdf = async (cotizacionId: number) => {
    try {
      setIsPdfLoading(true);
      const response = await fetch(`/api/cotizacion/${cotizacionId}/pdf`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el PDF');
      }
      
      // Create a blob from the PDF Stream
      const blob = await response.blob();
      
      // Create a link element to download the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${cotizacionId}.pdf`;
      
      // Append to the document body, click it, then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL created
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF generado correctamente",
        description: "La cotización ha sido descargada como PDF.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: error instanceof Error ? error.message : 'Ha ocurrido un error al generar el PDF.',
        variant: "destructive",
      });
    } finally {
      setIsPdfLoading(false);
    }
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
      
      // Calculations for base materials - identical to debug function and recalculateAllPrices
      if (furnitureData.mat_huacal && materialsData.matHuacal) {
        totalPrice = totalPrice.plus(new Decimal(furnitureData.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier));
        componentLog.push(`mat_huacal: ${furnitureData.mat_huacal} * ${materialsData.matHuacal.costo} * ${multiplier} = ${new Decimal(furnitureData.mat_huacal).times(materialsData.matHuacal.costo).times(multiplier)}`);
      }
      
      if (furnitureData.mat_vista && materialsData.matVista) {
        totalPrice = totalPrice.plus(new Decimal(furnitureData.mat_vista).times(materialsData.matVista.costo).times(multiplier));
        componentLog.push(`mat_vista: ${furnitureData.mat_vista} * ${materialsData.matVista.costo} * ${multiplier} = ${new Decimal(furnitureData.mat_vista).times(materialsData.matVista.costo).times(multiplier)}`);
      }
      
      if (furnitureData.chap_huacal && materialsData.chapHuacal) {
        totalPrice = totalPrice.plus(new Decimal(furnitureData.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier));
        componentLog.push(`chap_huacal: ${furnitureData.chap_huacal} * ${materialsData.chapHuacal.costo} * ${multiplier} = ${new Decimal(furnitureData.chap_huacal).times(materialsData.chapHuacal.costo).times(multiplier)}`);
      }
      
      if (furnitureData.chap_vista && materialsData.chapVista) {
        totalPrice = totalPrice.plus(new Decimal(furnitureData.chap_vista).times(materialsData.chapVista.costo).times(multiplier));
        componentLog.push(`chap_vista: ${furnitureData.chap_vista} * ${materialsData.chapVista.costo} * ${multiplier} = ${new Decimal(furnitureData.chap_vista).times(materialsData.chapVista.costo).times(multiplier)}`);
      }
      
      if (furnitureData.jaladera && materialsData.jaladera) {
        totalPrice = totalPrice.plus(new Decimal(furnitureData.jaladera).times(materialsData.jaladera.costo).times(multiplier));
        componentLog.push(`jaladera: ${furnitureData.jaladera} * ${materialsData.jaladera.costo} * ${multiplier} = ${new Decimal(furnitureData.jaladera).times(materialsData.jaladera.costo).times(multiplier)}`);
      }
      
      if (furnitureData.corredera && materialsData.corredera) {
        totalPrice = totalPrice.plus(new Decimal(furnitureData.corredera).times(materialsData.corredera.costo).times(multiplier));
        componentLog.push(`corredera: ${furnitureData.corredera} * ${materialsData.corredera.costo} * ${multiplier} = ${new Decimal(furnitureData.corredera).times(materialsData.corredera.costo).times(multiplier)}`);
      }
      
      if (furnitureData.bisagras && materialsData.bisagra) {
        totalPrice = totalPrice.plus(new Decimal(furnitureData.bisagras).times(materialsData.bisagra.costo).times(multiplier));
        componentLog.push(`bisagras: ${furnitureData.bisagras} * ${materialsData.bisagra.costo} * ${multiplier} = ${new Decimal(furnitureData.bisagras).times(materialsData.bisagra.costo).times(multiplier)}`);
      }
      
      // Direct accessory calculations - identical to debug function and recalculateAllPrices
      if (furnitureData.patas && furnitureData.patas > 0) {
        const patasMaterial = findAccessory({ name: 'patas', category: 'patas' });
        const cost = patasMaterial ? patasMaterial.costo : 15;
        totalPrice = totalPrice.plus(new Decimal(furnitureData.patas).times(cost).times(multiplier));
        componentLog.push(`patas: ${furnitureData.patas} * ${cost} * ${multiplier} = ${new Decimal(furnitureData.patas).times(cost).times(multiplier)}`);
      }
      
      if (furnitureData.clip_patas && furnitureData.clip_patas > 0) {
        const clipMaterial = findAccessory({ name: 'clip_patas', category: 'clip patas' });
        const cost = clipMaterial ? clipMaterial.costo : 5;
        totalPrice = totalPrice.plus(new Decimal(furnitureData.clip_patas).times(cost).times(multiplier));
        componentLog.push(`clip_patas: ${furnitureData.clip_patas} * ${cost} * ${multiplier} = ${new Decimal(furnitureData.clip_patas).times(cost).times(multiplier)}`);
      }
      
      if (furnitureData.mensulas && furnitureData.mensulas > 0) {
        const mensulasMaterial = findAccessory({ name: 'mensulas', category: 'mensulas' });
        const cost = mensulasMaterial ? mensulasMaterial.costo : 8;
        totalPrice = totalPrice.plus(new Decimal(furnitureData.mensulas).times(cost).times(multiplier));
        componentLog.push(`mensulas: ${furnitureData.mensulas} * ${cost} * ${multiplier} = ${new Decimal(furnitureData.mensulas).times(cost).times(multiplier)}`);
      }
      
      if (furnitureData.kit_tornillo && furnitureData.kit_tornillo > 0) {
        const kitMaterial = findAccessory({ name: 'kit_tornillo', category: 'kit tornillo' });
        const cost = kitMaterial ? kitMaterial.costo : 10;
        totalPrice = totalPrice.plus(new Decimal(furnitureData.kit_tornillo).times(cost).times(multiplier));
        componentLog.push(`kit_tornillo: ${furnitureData.kit_tornillo} * ${cost} * ${multiplier} = ${new Decimal(furnitureData.kit_tornillo).times(cost).times(multiplier)}`);
      }
      
      if (furnitureData.cif && furnitureData.cif > 0) {
        const cifMaterial = findAccessory({ name: 'cif', category: 'cif' });
        const cost = cifMaterial ? cifMaterial.costo : 12;
        totalPrice = totalPrice.plus(new Decimal(furnitureData.cif).times(cost).times(multiplier));
        componentLog.push(`cif: ${furnitureData.cif} * ${cost} * ${multiplier} = ${new Decimal(furnitureData.cif).times(cost).times(multiplier)}`);
      }
      
      // Generate a summary of all component costs for debugging
      console.log("Price components:");
      componentLog.forEach(log => console.log(`- ${log}`));
      console.log("Total calculated price before rounding:", totalPrice.toString());
      
      // Convert to number with precise decimal places - identical to recalculateAllPrices
      const finalPrice = totalPrice.toDecimalPlaces(2).toNumber();
      console.log(`Final rounded price for item ${index}: ${finalPrice}`);
      
      // Directly update the unitPrice field
      form.setValue(`items.${index}.unitPrice`, finalPrice);
    } catch (error) {
      console.error('Error calculating item price:', error);
      toast({
        title: "Error de cálculo",
        description: "Ocurrió un error al calcular el precio. Revise los datos e intente nuevamente."
      });
    }
  };
}