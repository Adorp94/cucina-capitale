'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, CalendarIcon, Plus, Trash2, Loader2, Search, ChevronDown, Calculator, X, Package, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from "@/components/ui/use-toast"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DayPicker } from "react-day-picker";
import Image from 'next/image';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { 
  generateFurnitureCode,
  parseProjectCode,
  AREAS,
  FURNITURE_TYPES,
  type FurnitureCodeConfig 
} from '@/lib/project-codes';

// Component to highlight search matches in text
const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  if (!query || query.length < 1) return <span>{text}</span>;
  
  try {
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <span key={i} className="bg-yellow-100 dark:bg-yellow-800 font-medium">{part}</span> : 
            <span key={i}>{part}</span>
        )}
      </span>
    );
  } catch (e) {
    // In case of regex failure
    return <span>{text}</span>;
  }
};

// Updated schema with materials and inventory data
const cotizacionFormSchema = z.object({
  // Client Information
  clientId: z.number().min(1, { message: "Cliente requerido" }),
  clientName: z.string().min(1, { message: "Nombre del cliente requerido" }),
  clientEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  
  // Project Information
  projectName: z.string().min(1, { message: "Nombre del proyecto requerido" }),
  projectType: z.string().min(1, { message: "Tipo de proyecto requerido" }),
  prototipo: z.string().optional(), // For vertical projects (B1, A2, PH, etc.)
  cotizacionDate: z.date(),
  validUntil: z.date(),
  
  // Team Information
  vendedor: z.string().min(1, { message: "Vendedor requerido" }),
  fabricante: z.string().min(1, { message: "Fabricante requerido" }),
  instalador: z.string().min(1, { message: "Instalador requerido" }),
  
  // Materials
  matHuacal: z.string().optional(),
  matVista: z.string().optional(),
  chapHuacal: z.string().optional(),
  chapVista: z.string().optional(),
  jaladera: z.string().optional(),
  corredera: z.string().optional(),  // Changed from correderas to corredera
  bisagras: z.string().optional(),
  tipOnLargo: z.string().optional(),
  
  // Delivery and Payment
  deliveryTime: z.number().int().min(1, { message: "Tiempo de entrega requerido" }),
  paymentTerms: z.string().min(1, { message: "Condiciones de pago requeridas" }),
  
  // Items/Products with furnitureData
  items: z.array(
    z.object({
      description: z.string().min(1, { message: "Descripción requerida" }),
      quantity: z.number().int().min(1, { message: "Cantidad debe ser al menos 1" }),
      unitPrice: z.number().min(0, { message: "Precio unitario debe ser positivo" }),
      discount: z.number().min(0).max(100, { message: "Descuento debe estar entre 0 y 100" }).default(0),
      // Add area and furniture type fields for project coding
      area: z.string().optional(),
      furnitureType: z.string().optional(),
      productionType: z.enum(['original', 'additional', 'warranty']).default('original').optional(),
      furnitureData: z.object({
        insumo_id: z.number().optional(),
        mat_huacal: z.number().nullable().optional(),
        mat_vista: z.number().nullable().optional(),
        chap_huacal: z.number().nullable().optional(),
        chap_vista: z.number().nullable().optional(),
        jaladera: z.number().nullable().optional(),
        corredera: z.number().nullable().optional(),  // Fixed: Changed from correderas to corredera
        bisagras: z.number().nullable().optional(),
        patas: z.number().nullable().optional(),
        clip_patas: z.number().nullable().optional(),
        mensulas: z.number().nullable().optional(),
        kit_tornillo: z.number().nullable().optional(),
        cif: z.number().nullable().optional(),
        cajones: z.number().nullable().optional(),
        puertas: z.number().nullable().optional(),
        entrepaños: z.number().nullable().optional(),
        tip_on_largo: z.number().nullable().optional(),
        u_tl: z.number().min(0).default(0).optional(),
        t_tl: z.number().min(0).default(0).optional(),
      }).optional(),
    })
  ),
  
  // Notes
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof cotizacionFormSchema>;

const TIPOS_PROYECTO = [
  { id: "1", name: "Residencial" },
  { id: "3", name: "Desarrollo" },
];

// Add constants for team selection
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

// Format currency for display
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

// New Client Modal Component
const NewClientModal = ({ 
  open, 
  onClose, 
  onSave 
}: { 
  open: boolean; 
  onClose: () => void; 
  onSave: (client: { id: number; name: string; email?: string; phone?: string; address?: string }) => void 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create form for new client
  const clientForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "El nombre es obligatorio"),
        email: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    ),
  });
  
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Create Supabase client
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Insert the new client
      const { data: newClient, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: data.name,
          correo: data.email || null,
          celular: data.phone || null,
          direccion: data.address || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Call onSave with the new client data
      onSave({
        id: Number(newClient.id_cliente),
        name: newClient.nombre,
        email: newClient.correo,
        phone: newClient.celular,
        address: newClient.direccion
      });
      
      // Close the modal
      onClose();
      
      // Reset the form
      clientForm.reset();
      
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar el cliente. Por favor, intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={clientForm.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="Nombre del cliente"
                {...clientForm.register("name")}
              />
              {clientForm.formState.errors.name && (
                <p className="text-sm text-red-500">{clientForm.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                {...clientForm.register("email")}
              />
              {clientForm.formState.errors.email && (
                <p className="text-sm text-red-500">{clientForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="(123) 456-7890"
                {...clientForm.register("phone")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Dirección del cliente"
                {...clientForm.register("address")}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cliente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function CotizacionForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState("client");
  
  // Material states
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [tabletosMaterials, setTabletosMaterials] = useState<any[]>([]);
  const [chapacintaMaterials, setChapacintaMaterials] = useState<any[]>([]);
  const [jaladeraMaterials, setJaladeraMaterials] = useState<any[]>([]);
  const [correderasMaterials, setCorrederasMaterials] = useState<any[]>([]);
  const [bisagrasMaterials, setBisagrasMaterials] = useState<any[]>([]);
  const [tipOnLargoMaterials, setTipOnLargoMaterials] = useState<any[]>([]);
  
  // State for tracking totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  });
  
  // Add inventory state
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  
  // Add enhanced search states
  // Manual categories list - these won't change frequently
  const CATEGORIES = [
    'Alacena',
    'Alacena Esquinera', 
    'Alacena Esquinera TipOn',
    'Alacena TipOn',
    'Cajón',
    'Cajón con vista',
    'Cajonera',
    'Cajón interno',
    'Cajón interno Vista', 
    'Cajón U',
    'Cajón U con vista',
    'Closet',
    'Decorativo',
    'Entrepaño',
    'Gabinete',
    'Gabinete Esquinero',
    'Huacal',
    'Locker',
    'Locker TipOn',
    'Parrilla',
    'Repisa Doble Cfijación',
    'Repisa Doble Simple',
    'Repisa Triple Cfijación', 
    'Repisa Triple Simple',
    'Tarja',
    'Vista',
    'Zapatero'
  ];
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Infinite scrolling states
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;
  
  // Add client state
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clients, setClients] = useState<Array<{
    id: number; 
    name: string; 
    email: string | null; 
    phone: string | null;
    address: string | null;
  }>>([]);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [isClientSubmitting, setIsClientSubmitting] = useState(false);
  
  // Add states for material comboboxes
  const [openMatHuacalCombobox, setOpenMatHuacalCombobox] = useState(false);
  const [openMatVistaCombobox, setOpenMatVistaCombobox] = useState(false);
  const [openChapHuacalCombobox, setOpenChapHuacalCombobox] = useState(false);
  const [openChapVistaCombobox, setOpenChapVistaCombobox] = useState(false);
  const [openJaladeraCombobox, setOpenJaladeraCombobox] = useState(false);
  const [openCorrederaCombobox, setOpenCorrederaCombobox] = useState(false);
  const [openBisagrasCombobox, setOpenBisagrasCombobox] = useState(false);
  const [openTipOnLargoCombobox, setOpenTipOnLargoCombobox] = useState(false);
  
  // Add states for filtered materials in search
  const [filteredTabletos, setFilteredTabletos] = useState<any[]>([]);
  const [filteredChapacinta, setFilteredChapacinta] = useState<any[]>([]);
  const [filteredJaladera, setFilteredJaladera] = useState<any[]>([]);
  const [filteredCorrederas, setFilteredCorrederas] = useState<any[]>([]);
  const [filteredBisagras, setFilteredBisagras] = useState<any[]>([]);
  const [filteredTipOnLargo, setFilteredTipOnLargo] = useState<any[]>([]);
  
  // Add state for current search
  const [matHuacalSearch, setMatHuacalSearch] = useState("");
  const [matVistaSearch, setMatVistaSearch] = useState("");
  const [chapHuacalSearch, setChapHuacalSearch] = useState("");
  const [chapVistaSearch, setChapVistaSearch] = useState("");
  const [jaladeraSearch, setJaladeraSearch] = useState("");
  const [correderaSearch, setCorrederaSearch] = useState("");
  const [bisagrasSearch, setBisagrasSearch] = useState("");
  const [tipOnLargoSearch, setTipOnLargoSearch] = useState("");
  
  // Add state for debug calculation display
  const [showDebugCalculations, setShowDebugCalculations] = useState(false);
  
  // Add ref for search debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add state variables for date pickers
  const [isCotizacionDateOpen, setIsCotizacionDateOpen] = useState(false);
  const [isValidUntilOpen, setIsValidUntilOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues: {
      clientId: undefined,
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      projectName: "",
      projectType: "1",
      prototipo: "", // For vertical projects (B1, A2, PH, etc.)
      cotizacionDate: new Date(),
      validUntil: addDays(new Date(), 15), // Set default to 15 days from today
      vendedor: "",
      fabricante: "",
      instalador: "",
      matHuacal: "none",
      matVista: "none",
      chapHuacal: "none",
      chapVista: "none",
      jaladera: "none",
      corredera: "none",
      bisagras: "none",
      tipOnLargo: "none",
      deliveryTime: 90,
      paymentTerms: "70% anticipo, 30% contra entrega",
      items: [],
      notes: "",
    },
  });
  
  // Set up fieldArray for items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });
  
  // Fetch materials from Supabase
  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoadingMaterials(true);
      try {
        console.log("Fetching materials...");
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Fetch Tableros materials (fixed: was 'Tabletos')
        const { data: tablerosData, error: tablerosError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Tableros')
          .order('nombre', { ascending: true });
          
        if (tablerosError) throw tablerosError;
        setTabletosMaterials(tablerosData || []);
        
        // Fetch Cubrecantos materials (fixed: was 'Chapacinta')
        const { data: cubrecantosData, error: cubrecantosError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Cubrecantos')
          .order('nombre', { ascending: true });
          
        if (cubrecantosError) throw cubrecantosError;
        setChapacintaMaterials(cubrecantosData || []);
        
        // Fetch Jaladeras materials
        const { data: jaladerasData, error: jaladerasError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Jaladeras')
          .order('nombre', { ascending: true });
          
        if (jaladerasError) throw jaladerasError;
        setJaladeraMaterials(jaladerasData || []);
        
        // Fetch Correderas materials
        const { data: correderasData, error: correderasError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Correderas')
          .order('nombre', { ascending: true });
          
        if (correderasError) throw correderasError;
        setCorrederasMaterials(correderasData || []);
        
        // Fetch Bisagras materials
        const { data: bisagrasData, error: bisagrasError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Bisagras')
          .order('nombre', { ascending: true });
          
        if (bisagrasError) throw bisagrasError;
        setBisagrasMaterials(bisagrasData || []);
        
        console.log("Materials loaded successfully");
        console.log("Tableros count:", tablerosData?.length);
        console.log("Cubrecantos count:", cubrecantosData?.length);
        console.log("Jaladeras count:", jaladerasData?.length);
        console.log("Correderas count:", correderasData?.length);
        console.log("Bisagras count:", bisagrasData?.length);
        
      } catch (error) {
        console.error('Error fetching materials:', error);
        
        // Set mock data if error
        setTabletosMaterials([
          { id_material: 1, nombre: 'Melamina Blanca', costo: 120, tipo: 'Tabletos' },
          { id_material: 2, nombre: 'MDF 15mm', costo: 180, tipo: 'Tabletos' },
        ]);
        
        setChapacintaMaterials([
          { id_material: 3, nombre: 'Chapacinta PVC Blanco', costo: 5, tipo: 'Chapacinta' },
          { id_material: 4, nombre: 'Chapacinta PVC Nogal', costo: 8, tipo: 'Chapacinta' },
        ]);
        
        setJaladeraMaterials([
          { id_material: 5, nombre: 'Jaladera PVC Blanco', costo: 10, tipo: 'Jaladera' },
          { id_material: 6, nombre: 'Jaladera PVC Nogal', costo: 12, tipo: 'Jaladera' },
        ]);
        
        setCorrederasMaterials([
          { id_material: 7, nombre: 'Corredera PVC Blanco', costo: 5, tipo: 'Corredera' },
          { id_material: 8, nombre: 'Corredera PVC Nogal', costo: 7, tipo: 'Corredera' },
        ]);
        
        setBisagrasMaterials([
          { id_material: 9, nombre: 'Bisagra PVC Blanco', costo: 5, tipo: 'Bisagra' },
          { id_material: 10, nombre: 'Bisagra PVC Nogal', costo: 7, tipo: 'Bisagra' },
        ]);
        
        setTipOnLargoMaterials([
          { id_material: 11, nombre: 'TipOnLargo PVC Blanco', costo: 10, tipo: 'TipOnLargo' },
          { id_material: 12, nombre: 'TipOnLargo PVC Nogal', costo: 12, tipo: 'TipOnLargo' },
        ]);
      } finally {
        setIsLoadingMaterials(false);
      }
    };
    
    // Start loading materials immediately when component mounts
    fetchMaterials();
  }, []);
  
  // Calculate totals for the quotation
  const calculateTotals = () => {
    try {
      console.log("Calculating totals for all items");
      
      // Get current items
      const items = form.getValues("items") || [];
      
      // Skip calculation if there are no items
      if (items.length === 0) {
        console.log("No items to calculate totals for");
        setTotals({
          subtotal: 0,
          tax: 0,
          total: 0
        });
        return;
      }
      
      console.log("Items to calculate totals for:", items);
      
      // Calculate subtotal - sum of (quantity * unitPrice * (1 - discount/100))
      let subtotal = 0;
      
      items.forEach((item, index) => {
        // Ensure numeric values
        const quantity = parseFloat(item.quantity.toString()) || 0;
        const unitPrice = parseFloat(item.unitPrice.toString()) || 0;
        const discount = parseFloat(item.discount.toString()) || 0;
        
        // Calculate item total considering discount
        const discountMultiplier = 1 - (discount / 100);
        const itemTotal = quantity * unitPrice * discountMultiplier;
        
        console.log(`Item ${index+1} (${item.description}): ${quantity} × $${unitPrice} × ${discountMultiplier} = $${itemTotal.toFixed(2)}`);
        
        // Add to subtotal
        subtotal += itemTotal;
      });
      
      // Calculate tax (16%)
      const taxRate = 0.16;
      const tax = subtotal * taxRate;
      
      // Calculate total
      const total = subtotal + tax;
      
      console.log(`Subtotal: $${subtotal.toFixed(2)}, Tax (16%): $${tax.toFixed(2)}, Total: $${total.toFixed(2)}`);
      
      // Update the totals state
      setTotals({
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      });
    } catch (error) {
      console.error("Error calculating totals:", error);
    }
  };

  // Debug calculation function to show detailed price breakdown
  const getDebugCalculations = () => {
    const items = form.getValues("items") || [];
    const projectType = form.getValues('projectType');
    
    if (items.length === 0) return [];
    
    // Determine multiplier
    let multiplier = 1;
    if (projectType === "1") { // Residencial
      multiplier = 1.8;
    } else if (projectType === "3") { // Desarrollo
      multiplier = 1.5;
    }
    
    // Get selected materials
    const matHuacalId = form.getValues('matHuacal');
    const matVistaId = form.getValues('matVista');
    const chapHuacalId = form.getValues('chapHuacal');
    const chapVistaId = form.getValues('chapVista');
    const jaladeraId = form.getValues('jaladera');
    const correderaId = form.getValues('corredera');
    const bisagrasId = form.getValues('bisagras');
    const tipOnLargoId = form.getValues('tipOnLargo');
    
    const matHuacalMaterial = matHuacalId && matHuacalId !== "none" ? 
      tabletosMaterials.find(m => m.id_material.toString() === matHuacalId) : null;
    const matVistaMaterial = matVistaId && matVistaId !== "none" ? 
      tabletosMaterials.find(m => m.id_material.toString() === matVistaId) : null;
    const chapHuacalMaterial = chapHuacalId && chapHuacalId !== "none" ? 
      chapacintaMaterials.find(m => m.id_material.toString() === chapHuacalId) : null;
    const chapVistaMaterial = chapVistaId && chapVistaId !== "none" ? 
      chapacintaMaterials.find(m => m.id_material.toString() === chapVistaId) : null;
    const jaladeraMaterial = jaladeraId && jaladeraId !== "none" ? 
      jaladeraMaterials.find(m => m.id_material.toString() === jaladeraId) : null;
    const correderaMaterial = correderaId && correderaId !== "none" ? 
      correderasMaterials.find(m => m.id_material.toString() === correderaId) : null;
    const bisagrasMaterial = bisagrasId && bisagrasId !== "none" ? 
      bisagrasMaterials.find(m => m.id_material.toString() === bisagrasId) : null;
    const tipOnLargoMaterial = tipOnLargoId && tipOnLargoId !== "none" ? 
      tipOnLargoMaterials.find(m => m.id_material.toString() === tipOnLargoId) : null;
    
    // Default costs for accessories
    const DEFAULT_PATAS_COST = 10;
    const DEFAULT_CLIP_PATAS_COST = 2;
    const DEFAULT_MENSULAS_COST = 0.9;
    const DEFAULT_KIT_TORNILLO_COST = 30;
    const DEFAULT_CIF_COST = 100;
    
    return items.map((item, index) => {
      const furnitureData = item.furnitureData;
      if (!furnitureData) {
        return {
          index,
          description: item.description,
          components: [],
          calculatedPrice: 0,
          storedPrice: item.unitPrice || 0,
          hasDiscrepancy: false
        };
      }
      
      const components = [];
      let calculatedPrice = 0;
      
      // Calculate each component
      if (furnitureData.mat_huacal && matHuacalMaterial) {
        const cost = furnitureData.mat_huacal * matHuacalMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Material Huacal',
          material: matHuacalMaterial.nombre,
          quantity: furnitureData.mat_huacal,
          unitCost: matHuacalMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.mat_vista && matVistaMaterial) {
        const cost = furnitureData.mat_vista * matVistaMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Material Vista',
          material: matVistaMaterial.nombre,
          quantity: furnitureData.mat_vista,
          unitCost: matVistaMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.chap_huacal && chapHuacalMaterial) {
        const cost = furnitureData.chap_huacal * chapHuacalMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Chapacinta Huacal',
          material: chapHuacalMaterial.nombre,
          quantity: furnitureData.chap_huacal,
          unitCost: chapHuacalMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.chap_vista && chapVistaMaterial) {
        const cost = furnitureData.chap_vista * chapVistaMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Chapacinta Vista',
          material: chapVistaMaterial.nombre,
          quantity: furnitureData.chap_vista,
          unitCost: chapVistaMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.jaladera && jaladeraMaterial) {
        const cost = furnitureData.jaladera * jaladeraMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Jaladera',
          material: jaladeraMaterial.nombre,
          quantity: furnitureData.jaladera,
          unitCost: jaladeraMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.corredera && correderaMaterial) {
        const cost = furnitureData.corredera * correderaMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Corredera',
          material: correderaMaterial.nombre,
          quantity: furnitureData.corredera,
          unitCost: correderaMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.bisagras && bisagrasMaterial) {
        const cost = furnitureData.bisagras * bisagrasMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Bisagras',
          material: bisagrasMaterial.nombre,
          quantity: furnitureData.bisagras,
          unitCost: bisagrasMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.tip_on_largo && tipOnLargoMaterial) {
        const cost = furnitureData.tip_on_largo * tipOnLargoMaterial.costo * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Tip-on Largo',
          material: tipOnLargoMaterial.nombre,
          quantity: furnitureData.tip_on_largo,
          unitCost: tipOnLargoMaterial.costo,
          multiplier,
          total: cost
        });
      }
      
      // Add accessories
      if (furnitureData.patas && furnitureData.patas > 0) {
        const cost = furnitureData.patas * DEFAULT_PATAS_COST * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Patas',
          material: 'Patas estándar',
          quantity: furnitureData.patas,
          unitCost: DEFAULT_PATAS_COST,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.clip_patas && furnitureData.clip_patas > 0) {
        const cost = furnitureData.clip_patas * DEFAULT_CLIP_PATAS_COST * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Clip Patas',
          material: 'Clip patas estándar',
          quantity: furnitureData.clip_patas,
          unitCost: DEFAULT_CLIP_PATAS_COST,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.mensulas && furnitureData.mensulas > 0) {
        const cost = furnitureData.mensulas * DEFAULT_MENSULAS_COST * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Ménsulas',
          material: 'Ménsulas estándar',
          quantity: furnitureData.mensulas,
          unitCost: DEFAULT_MENSULAS_COST,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.kit_tornillo && furnitureData.kit_tornillo > 0) {
        const cost = furnitureData.kit_tornillo * DEFAULT_KIT_TORNILLO_COST * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'Kit Tornillo',
          material: 'Kit tornillo estándar',
          quantity: furnitureData.kit_tornillo,
          unitCost: DEFAULT_KIT_TORNILLO_COST,
          multiplier,
          total: cost
        });
      }
      
      if (furnitureData.cif && furnitureData.cif > 0) {
        const cost = furnitureData.cif * DEFAULT_CIF_COST * multiplier;
        calculatedPrice += cost;
        components.push({
          name: 'CIF',
          material: 'CIF estándar',
          quantity: furnitureData.cif,
          unitCost: DEFAULT_CIF_COST,
          multiplier,
          total: cost
        });
      }
      
      // Round calculated price
      calculatedPrice = Math.round(calculatedPrice * 100) / 100;
      const storedPrice = item.unitPrice || 0;
      const hasDiscrepancy = Math.abs(calculatedPrice - storedPrice) > 0.01;
      
      return {
        index,
        description: item.description,
        components,
        calculatedPrice,
        storedPrice,
        hasDiscrepancy,
        quantity: item.quantity || 1,
        discount: item.discount || 0
      };
    });
  };

  // Add function to handle price, quantity, or discount changes
  const handleItemValueChange = (index: number, field: string, value: any) => {
    console.log(`Updating ${field} for item ${index} to:`, value);
    
    // Parse the value to make sure it's a number
    let numValue = parseFloat(value);
    
    // Set to 0 if NaN
    if (isNaN(numValue)) {
      numValue = 0;
    }
    
    // Update the form with the parsed value using the appropriate path
    if (field === 'quantity') {
      form.setValue(`items.${index}.quantity`, numValue);
    } else if (field === 'unitPrice') {
      form.setValue(`items.${index}.unitPrice`, numValue);
    } else if (field === 'discount') {
      form.setValue(`items.${index}.discount`, numValue);
    }
    
    // Recalculate totals with a slight delay to ensure state is updated
    setTimeout(() => {
      calculateTotals();
    }, 10);
  };

  // Add function to generate individual furniture codes
  const generateItemCode = (index: number): string | null => {
    const item = form.getValues(`items.${index}`);
    const projectType = form.getValues('projectType');
    const prototipo = form.getValues('prototipo');
    const cotizacionDate = form.getValues('cotizacionDate');
    
    if (!item.area || !item.furnitureType) {
      return null; // Cannot generate code without area and furniture type
    }
    
    try {
      const config: FurnitureCodeConfig = {
        projectType: projectType === '1' ? 'residencial' : 'vertical',
        verticalProject: projectType === '3' ? 'WN' : undefined, // Default to WN for now
        date: cotizacionDate,
        consecutiveNumber: 1, // This would come from the generated project code
        prototipo: projectType === '3' ? prototipo : undefined,
        area: item.area,
        muebleType: item.furnitureType,
        productionType: item.productionType === 'additional' ? 'A' : 
                       item.productionType === 'warranty' ? 'G' : undefined
      };
      
      return generateFurnitureCode(config);
    } catch (error) {
      console.error('Error generating furniture code:', error);
      return null;
    }
  };

  // Watch for changes to items to update totals
  form.watch((value, { name }) => {
    if (name?.startsWith('items')) {
      calculateTotals();
    }
  });

  // Watch for changes to item area, furniture type, or production type to trigger code regeneration
  const watchedItems = form.watch('items');
  
  // Initialize totals when component mounts
  useEffect(() => {
    calculateTotals();
  }, []);
  
  // Trigger re-render when watched items change (for code updates)
  useEffect(() => {
    // This effect will trigger when any item changes, causing codes to recalculate
  }, [watchedItems]);
  
  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch inventory items with infinite scrolling
  const fetchInventory = useCallback(async (searchQuery = '', category = '', page = 0, append = false) => {
    if (page === 0) {
      setIsLoadingInventory(true);
      setInventoryItems([]);
      setCurrentPage(0);
      setHasMoreItems(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      let query = supabase
        .from('insumos')
        .select('*', { count: 'exact' });
      
      // Add category filter if specified
      if (category && category !== '') {
        query = query.eq('categoria', category);
      }
      
      // Add search filter - search in descripcion if category is selected, otherwise in mueble
      if (searchQuery && searchQuery.length >= 2) {
        if (category && category !== '') {
          query = query.ilike('descripcion', `%${searchQuery}%`);
        } else {
          query = query.ilike('mueble', `%${searchQuery}%`);
        }
      }
      
      // Add pagination and ordering
      if (category && category !== '') {
        query = query.order('descripcion').range(from, to);
      } else {
        query = query.order('categoria').order('descripcion').range(from, to);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching inventory items:', error);
        return;
      }
      
      const newItems = data || [];
      const hasMore = count ? from + newItems.length < count : false;
      
      console.log(`Fetched ${newItems.length} items (page ${page}). Total: ${count}, HasMore: ${hasMore}`);
      
      if (append && page > 0) {
        setInventoryItems(prev => [...prev, ...newItems]);
      } else {
        setInventoryItems(newItems);
      }
      
      setCurrentPage(page);
      setHasMoreItems(hasMore);
      setTotalCount(count || 0);
      
    } catch (error) {
      console.error('Error in fetchInventory:', error);
      // Set mock data if there's an error
      if (page === 0) {
        setInventoryItems([
          { insumo_id: 1, mueble: 'Alacena 60x30x70', categoria: 'Alacena', descripcion: '60x30x70, 2P, Si-Jalad', mat_huacal: 0.5, mat_vista: 0.6, chap_huacal: 2.5, chap_vista: 3 },
          { insumo_id: 2, mueble: 'Base 90x60x85', categoria: 'Gabinete', descripcion: '90x60x85, 1P, No-Jalad', mat_huacal: 0.8, mat_vista: 0.9, chap_huacal: 3.5, chap_vista: 4 },
          { insumo_id: 3, mueble: 'Cajón 40x20x15', categoria: 'Cajón', descripcion: '40x20x15, Si-Jalad', mat_huacal: 0.3, mat_vista: 0.4, chap_huacal: 1.5, chap_vista: 2 },
          { insumo_id: 4, mueble: 'Closet 120x200x60', categoria: 'Closet', descripcion: '120x200x60, 2P, No-Jalad', mat_huacal: 2.5, mat_vista: 3.0, chap_huacal: 8.0, chap_vista: 10 },
        ]);
        setHasMoreItems(false);
        setTotalCount(4);
      }
    } finally {
      setIsLoadingInventory(false);
      setIsLoadingMore(false);
    }
  }, [PAGE_SIZE]);
  
  // Function to load more items (infinite scroll)
  const loadMoreItems = useCallback(() => {
    if (!isLoadingMore && hasMoreItems) {
      fetchInventory(inventorySearchQuery, selectedCategory, currentPage + 1, true);
    }
  }, [fetchInventory, inventorySearchQuery, selectedCategory, currentPage, isLoadingMore, hasMoreItems]);
  
  // Helper functions to map categories to default area and furniture type codes
  const getDefaultAreaForCategory = (categoria: string): string => {
    const categoryMap: Record<string, string> = {
      'Alacena': 'CL', // Closet
      'Alacena Esquinera': 'CL',
      'Alacena Esquinera TipOn': 'CL',
      'Alacena TipOn': 'CL',
      'Gabinete': 'CL',
      'Gabinete Esquinero': 'CL',
      'Cajón': 'CL',
      'Cajón con vista': 'CL',
      'Cajonera': 'CL',
      'Cajón interno': 'CL',
      'Cajón interno Vista': 'CL',
      'Cajón U': 'CL',
      'Cajón U con vista': 'CL',
      'Closet': 'VD', // Vestidor
      'Despensa': 'DP',
      'Lavandería': 'LV',
      'Locker': 'CL',
      'Locker TipOn': 'CL',
      'Parrilla': 'CL',
      'Tarja': 'CL',
      'Decorativo': 'ES', // Especialidad
      'Huacal': 'CL',
      'Entrepaño': 'CL',
      'Vista': 'CL',
      'Zapatero': 'VD',
      'Repisa Doble Cfijación': 'CL',
      'Repisa Doble Simple': 'CL',
      'Repisa Triple Cfijación': 'CL',
      'Repisa Triple Simple': 'CL',
      'Librero': 'LB'
    };
    
    return categoryMap[categoria] || 'CL'; // Default to Closet
  };

  const getDefaultFurnitureTypeForCategory = (categoria: string): string => {
    const categoryMap: Record<string, string> = {
      'Alacena': 'ALC',
      'Alacena Esquinera': 'ALE',
      'Alacena Esquinera TipOn': 'AET',
      'Alacena TipOn': 'ALT',
      'Gabinete': 'GAB',
      'Gabinete Esquinero': 'GAE',
      'Cajón': 'CJN',
      'Cajón con vista': 'CJV',
      'Cajonera': 'CAJ',
      'Cajón interno': 'CJI',
      'Cajón interno Vista': 'CIV',
      'Cajón U': 'CJU',
      'Cajón U con vista': 'CUV',
      'Closet': 'CLO',
      'Locker': 'LOC',
      'Locker TipOn': 'LOT',
      'Parrilla': 'PAR',
      'Tarja': 'TAR',
      'Decorativo': 'DEC',
      'Huacal': 'HUA',
      'Entrepaño': 'ENT',
      'Vista': 'VIS',
      'Zapatero': 'ZAP',
      'Repisa Doble Cfijación': 'RDC',
      'Repisa Triple Cfijación': 'RTC'
    };
    
    return categoryMap[categoria] || 'ACC'; // Default to Accesorio
  };
  
  // Add function to add an inventory item
  const addInventoryItem = (item: any) => {
    console.log("Adding inventory item:", item);
    
    // Create furniture data object with all possible fields from inventory
    const furnitureData = {
      insumo_id: item.insumo_id,
      mat_huacal: item.mat_huacal || null,
      mat_vista: item.mat_vista || null,
      chap_huacal: item.chap_huacal || null,
      chap_vista: item.chap_vista || null,
      jaladera: item.jaladera || null,
      corredera: item.corredera || null,  // Fixed: Changed from correderas to corredera
      bisagras: item.bisagras || null,
      // Add additional fields from the formula
      patas: item.patas || null,
      clip_patas: item.clip_patas || null,
      mensulas: item.mensulas || null,
      kit_tornillo: item.kit_tornillo || null,
      cif: item.cif || null,
      // Add these as well from the database
      cajones: item.cajones || null,
      puertas: item.puertas || null,
      entrepaños: item.entrepaños || null,
      // Add new tip_on_largo fields
      tip_on_largo: item.tip_on_largo || null,
      u_tl: item.u_tl || 0,
      t_tl: item.t_tl || 0,
    };
    
    console.log("Furniture data:", furnitureData);
    
    // Calculate price based on complete formula
    let price = 0;
    // Get all selected material IDs
    const matHuacalId = form.getValues('matHuacal');
    const matVistaId = form.getValues('matVista');
    const chapHuacalId = form.getValues('chapHuacal');
    const chapVistaId = form.getValues('chapVista');
    const jaladeraId = form.getValues('jaladera');
    const correderaId = form.getValues('corredera');
    const bisagrasId = form.getValues('bisagras');
    const tipOnLargoId = form.getValues('tipOnLargo');
    
    console.log("Selected material IDs:", {
      matHuacalId, matVistaId, chapHuacalId, chapVistaId, jaladeraId, correderaId, bisagrasId, tipOnLargoId
    });
    
    // Get all selected material objects with costs
    const matHuacalMaterial = matHuacalId && matHuacalId !== "none" ? 
      tabletosMaterials.find(m => m.id_material.toString() === matHuacalId) : null;
    const matVistaMaterial = matVistaId && matVistaId !== "none" ? 
      tabletosMaterials.find(m => m.id_material.toString() === matVistaId) : null;
    const chapHuacalMaterial = chapHuacalId && chapHuacalId !== "none" ? 
      chapacintaMaterials.find(m => m.id_material.toString() === chapHuacalId) : null;
    const chapVistaMaterial = chapVistaId && chapVistaId !== "none" ? 
      chapacintaMaterials.find(m => m.id_material.toString() === chapVistaId) : null;
    const jaladeraMaterial = jaladeraId && jaladeraId !== "none" ? 
      jaladeraMaterials.find(m => m.id_material.toString() === jaladeraId) : null;
    const correderaMaterial = correderaId && correderaId !== "none" ? 
      correderasMaterials.find(m => m.id_material.toString() === correderaId) : null;
    const bisagrasMaterial = bisagrasId && bisagrasId !== "none" ? 
      bisagrasMaterials.find(m => m.id_material.toString() === bisagrasId) : null;
    const tipOnLargoMaterial = tipOnLargoId && tipOnLargoId !== "none" ? 
      tipOnLargoMaterials.find(m => m.id_material.toString() === tipOnLargoId) : null;
    
    // Default cost values for fixed materials that are not selectable
    const DEFAULT_PATAS_COST = 10;
    const DEFAULT_CLIP_PATAS_COST = 2;
    const DEFAULT_MENSULAS_COST = 0.9;
    const DEFAULT_KIT_TORNILLO_COST = 30;
    const DEFAULT_CIF_COST = 100;
    
    console.log("Material objects:", {
      matHuacalMaterial, matVistaMaterial, chapHuacalMaterial, chapVistaMaterial, 
      jaladeraMaterial, correderaMaterial, bisagrasMaterial, tipOnLargoMaterial
    });
    
    // Apply multiplier based on project type
    const projectType = form.getValues('projectType');
    let multiplier = 1;
    
    // Set multiplier based on project type
    if (projectType === "1") { // Residencial
      multiplier = 1.8; // 180%
    } else if (projectType === "3") { // Desarrollo
      multiplier = 1.5; // 150%
    }
    
    console.log(`Project type: ${projectType}, Multiplier: ${multiplier}`);
    
    // COMPLETE FORMULA IMPLEMENTATION:
    // Calculate price components from selected materials
    
    // 1. Selected materials calculations
    if (furnitureData.mat_huacal && matHuacalMaterial) {
      const componentPrice = furnitureData.mat_huacal * matHuacalMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Material Huacal: ${furnitureData.mat_huacal} * ${matHuacalMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.mat_vista && matVistaMaterial) {
      const componentPrice = furnitureData.mat_vista * matVistaMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Material Vista: ${furnitureData.mat_vista} * ${matVistaMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.chap_huacal && chapHuacalMaterial) {
      const componentPrice = furnitureData.chap_huacal * chapHuacalMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Chapacinta Huacal: ${furnitureData.chap_huacal} * ${chapHuacalMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.chap_vista && chapVistaMaterial) {
      const componentPrice = furnitureData.chap_vista * chapVistaMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Chapacinta Vista: ${furnitureData.chap_vista} * ${chapVistaMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.jaladera && jaladeraMaterial) {
      const componentPrice = furnitureData.jaladera * jaladeraMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Jaladera: ${furnitureData.jaladera} * ${jaladeraMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.corredera && correderaMaterial) {
      const componentPrice = furnitureData.corredera * correderaMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Corredera: ${furnitureData.corredera} * ${correderaMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.bisagras && bisagrasMaterial) {
      const componentPrice = furnitureData.bisagras * bisagrasMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Bisagras: ${furnitureData.bisagras} * ${bisagrasMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.u_tl && tipOnLargoMaterial) {
      const componentPrice = furnitureData.u_tl * tipOnLargoMaterial.costo * multiplier;
      price += componentPrice;
      console.log(`Tip-on Largo: ${furnitureData.u_tl} * ${tipOnLargoMaterial.costo} * ${multiplier} = ${componentPrice}`);
    }
    
    // 2. Additional auto-included materials - these are not selectable but always added
    if (furnitureData.patas && furnitureData.patas > 0) {
      const componentPrice = furnitureData.patas * DEFAULT_PATAS_COST * multiplier;
      price += componentPrice;
      console.log(`Patas: ${furnitureData.patas} * ${DEFAULT_PATAS_COST} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.clip_patas && furnitureData.clip_patas > 0) {
      const componentPrice = furnitureData.clip_patas * DEFAULT_CLIP_PATAS_COST * multiplier;
      price += componentPrice;
      console.log(`Clip Patas: ${furnitureData.clip_patas} * ${DEFAULT_CLIP_PATAS_COST} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.mensulas && furnitureData.mensulas > 0) {
      const componentPrice = furnitureData.mensulas * DEFAULT_MENSULAS_COST * multiplier;
      price += componentPrice;
      console.log(`Ménsulas: ${furnitureData.mensulas} * ${DEFAULT_MENSULAS_COST} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.kit_tornillo && furnitureData.kit_tornillo > 0) {
      const componentPrice = furnitureData.kit_tornillo * DEFAULT_KIT_TORNILLO_COST * multiplier;
      price += componentPrice;
      console.log(`Kit Tornillo: ${furnitureData.kit_tornillo} * ${DEFAULT_KIT_TORNILLO_COST} * ${multiplier} = ${componentPrice}`);
    }
    
    if (furnitureData.cif && furnitureData.cif > 0) {
      const componentPrice = furnitureData.cif * DEFAULT_CIF_COST * multiplier;
      price += componentPrice;
      console.log(`CIF: ${furnitureData.cif} * ${DEFAULT_CIF_COST} * ${multiplier} = ${componentPrice}`);
    }
    
    // Log total price calculation summary  
    console.log(`Final calculated price before rounding: ${price}`);
    
    // Round to 2 decimal places
    price = Math.round(price * 100) / 100;
    
    console.log(`Final rounded price: ${price}`);
    
    // Create the new item with all the calculated data
    const newItem = {
      description: `${item.categoria} - ${item.descripcion}`,
      quantity: 1,
      unitPrice: price,
      discount: 0,
      // Auto-assign area and furniture type based on category
      area: getDefaultAreaForCategory(item.categoria),
      furnitureType: getDefaultFurnitureTypeForCategory(item.categoria),
      productionType: 'original' as const,
      furnitureData,
    };
    
    console.log("Adding new item to form:", newItem);
    
    // Add new item to the form
    append(newItem);
    
    // Ensure totals are recalculated immediately
    calculateTotals();
    
    // Close inventory search
    setShowInventorySearch(false);
    setSelectedInventoryItem(null);
    setInventorySearchQuery("");
    setSelectedCategory('');
    
    // Give React time to update the DOM before switching tabs
    setTimeout(() => {
      // Switch to items tab
      setCurrentTab("items");
      // Log the final state for debugging
      console.log("Final form values after adding item:", form.getValues());
      console.log("Updated totals:", totals);
    }, 10);
  };
  
  // Load inventory items when needed - only when there's a search query or category
  useEffect(() => {
    if (showInventorySearch && (inventorySearchQuery.length >= 2 || selectedCategory)) {
      fetchInventory(inventorySearchQuery, selectedCategory, 0, false);
    }
  }, [showInventorySearch, inventorySearchQuery, selectedCategory, fetchInventory]);

  // Add function to fetch clients
  const fetchClients = useCallback(async () => {
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
        
      if (error) throw error;
      
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
      // Add mock clients if error
      setClients([
        { id: 1, name: "Cliente Ejemplo 1", email: "cliente1@example.com", phone: "123-456-7890", address: "Dirección Ejemplo 1" },
        { id: 2, name: "Cliente Ejemplo 2", email: "cliente2@example.com", phone: "098-765-4321", address: "Dirección Ejemplo 2" },
        { id: 3, name: "Cliente Ejemplo 3", email: "cliente3@example.com", phone: "555-555-5555", address: "Dirección Ejemplo 3" },
      ]);
    } finally {
      setIsLoadingClients(false);
    }
  }, []);
  
  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(client => client.id.toString() === clientId);
    if (selectedClient) {
      form.setValue('clientId', selectedClient.id);
      form.setValue('clientName', selectedClient.name);
      form.setValue('clientEmail', selectedClient.email || '');
      form.setValue('clientPhone', selectedClient.phone || '');
      form.setValue('clientAddress', selectedClient.address || '');
    }
    setOpenClientCombobox(false);
  };

  // Handle adding a new client
  const handleNewClient = (client: { id: number; name: string; email?: string; phone?: string; address?: string }) => {
    // Add to clients list
    const newClient = {
      id: client.id,
      name: client.name,
      email: client.email || null,
      phone: client.phone || null,
      address: client.address || null
    };
    
    setClients(prevClients => [newClient, ...prevClients]);
    
    // Select the new client
    form.setValue('clientId', newClient.id);
    form.setValue('clientName', newClient.name);
    form.setValue('clientEmail', newClient.email || '');
    form.setValue('clientPhone', newClient.phone || '');
    form.setValue('clientAddress', newClient.address || '');
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Form data:", data);
      
      // Create a supabase client
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Calculate totals for database
      const subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.unitPrice.toString()) * parseFloat(item.quantity.toString()) * (1 - parseFloat(item.discount.toString()) / 100)), 0);
      const taxRate = 0.16; // 16% IVA
      const taxes = subtotal * taxRate;
      const total = subtotal + taxes;
      
      // Generate project code by calling the API
      let projectCode = null;
      try {
        console.log("Generating project code for:", {
          projectType: data.projectType,
          projectTypeName: data.projectType === '1' ? 'Residencial' : data.projectType === '3' ? 'Desarrollo' : 'Otro',
          verticalProject: data.projectType === '3' ? 'WN' : null
        });
        
        const projectCodeResponse = await fetch('/api/project-codes/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectType: data.projectType,
            verticalProject: data.projectType === '3' ? 'WN' : null, // Default to WN for development projects
            prototipo: data.projectType === '3' ? data.prototipo || null : null // Use form value for vertical projects
          }),
        });
        
        if (projectCodeResponse.ok) {
          const projectCodeData = await projectCodeResponse.json();
          projectCode = projectCodeData.projectCode;
          console.log("✅ Project code generated successfully:", {
            projectCode,
            consecutiveNumber: projectCodeData.consecutiveNumber,
            year: projectCodeData.year,
            month: projectCodeData.month
          });
        } else {
          const errorData = await projectCodeResponse.json();
          console.warn("⚠️ Could not generate project code:", errorData);
        }
      } catch (error) {
        console.warn("❌ Error generating project code:", error);
        // Continue without project code
      }
      
      // Get project type text based on ID
      const projectTypeMap: Record<string, string> = {
        "1": "Residencial",
        "2": "Comercial",
        "3": "Desarrollo",
        "4": "Institucional",
      };
      
      // Create the quotation object
      const quotationData = {
        id_cliente: data.clientId || null,
        project_name: data.projectName,
        project_type: data.projectType,  // The ID will be used in the PDF generation with a mapping
        subtotal,
        tax_rate: taxRate,
        taxes,
        total,
        valid_until: data.validUntil.toISOString(),
        delivery_time: data.deliveryTime,
        notes: data.notes || null,
        project_code: projectCode, // Add the generated project code
        // Remove fields that don't exist in the database schema
        // vendedor, fabricante, instalador are not in the cotizaciones table
      };
      
      console.log("Saving quotation data:", quotationData);
      
      // Insert quotation into database
      const { data: quotation, error: quotationError } = await supabase
        .from('cotizaciones')
        .insert([quotationData])
        .select()
        .single();

      if (quotationError) {
        console.error("Error inserting quotation:", quotationError);
        throw new Error(`No se pudo crear la cotización: ${quotationError.message}`);
      }

      console.log("Quotation saved:", quotation);
      console.log("Saving items:", data.items);
      
      // Insert quotation items
      const quotationItems = data.items.map((item, index) => ({
        id_cotizacion: quotation.id_cotizacion,
        insumo_id: item.furnitureData?.insumo_id || null,
        position: index,
        description: item.description,
        quantity: parseFloat(item.quantity.toString()),
        unit_price: parseFloat(item.unitPrice.toString()),
        total_price: parseFloat(item.unitPrice.toString()) * parseFloat(item.quantity.toString()) * (1 - parseFloat(item.discount.toString()) / 100),
        tip_on_largo: item.furnitureData?.tip_on_largo || 0,
        u_tl: item.furnitureData?.u_tl || 0,
        t_tl: item.furnitureData?.t_tl || 0
      }));

      const { error: itemsError } = await supabase
        .from('cotizacion_items')
        .insert(quotationItems);

      if (itemsError) {
        throw new Error(`Error al guardar los items: ${itemsError.message}`);
      }
      
      // Save materials to cotizacion_materiales table
      const materialsToSave = [];
      
      // Helper function to find material cost by ID
      const getMaterialCost = (materialId: string, collection: any[]) => {
        const material = collection.find(m => m.id_material.toString() === materialId);
        return material ? material.costo : 0;
      };
      
      // Process each material if it's not "none"
      if (data.matHuacal && data.matHuacal !== "none") {
        const costo = getMaterialCost(data.matHuacal, tabletosMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "matHuacal",
          id_material: parseInt(data.matHuacal),
          costo_usado: costo
        });
      }
      
      if (data.matVista && data.matVista !== "none") {
        const costo = getMaterialCost(data.matVista, tabletosMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "matVista",
          id_material: parseInt(data.matVista),
          costo_usado: costo
        });
      }
      
      if (data.chapHuacal && data.chapHuacal !== "none") {
        const costo = getMaterialCost(data.chapHuacal, chapacintaMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "chapHuacal",
          id_material: parseInt(data.chapHuacal),
          costo_usado: costo
        });
      }
      
      if (data.chapVista && data.chapVista !== "none") {
        const costo = getMaterialCost(data.chapVista, chapacintaMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "chapVista",
          id_material: parseInt(data.chapVista),
          costo_usado: costo
        });
      }
      
      if (data.jaladera && data.jaladera !== "none") {
        const costo = getMaterialCost(data.jaladera, jaladeraMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "jaladera",
          id_material: parseInt(data.jaladera),
          costo_usado: costo
        });
      }
      
      if (data.corredera && data.corredera !== "none") {
        const costo = getMaterialCost(data.corredera, correderasMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "corredera",
          id_material: parseInt(data.corredera),
          costo_usado: costo
        });
      }
      
      if (data.bisagras && data.bisagras !== "none") {
        const costo = getMaterialCost(data.bisagras, bisagrasMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "bisagras",
          id_material: parseInt(data.bisagras),
          costo_usado: costo
        });
      }
      
      if (data.tipOnLargo && data.tipOnLargo !== "none") {
        const costo = getMaterialCost(data.tipOnLargo, tipOnLargoMaterials);
        materialsToSave.push({
          id_cotizacion: quotation.id_cotizacion,
          tipo: "tipOnLargo",
          id_material: parseInt(data.tipOnLargo),
          costo_usado: costo
        });
      }
      
      console.log("Saving materials:", materialsToSave);
      
      if (materialsToSave.length > 0) {
        const { error: materialsError } = await supabase
          .from('cotizacion_materiales')
          .insert(materialsToSave);
          
        if (materialsError) {
          console.error("Error saving materials:", materialsError);
          // Don't throw error here, continue with success flow
        }
      }
      
      // Show success message using toast
      toast({
        title: "¡Cotización creada exitosamente!",
        description: projectCode 
          ? `Código de proyecto asignado: ${projectCode}`
          : "Cotización generada correctamente",
      });
      
      // Ask user if they want to download the PDF
      const shouldDownloadPdf = window.confirm('¿Desea descargar la cotización en PDF?');
      if (shouldDownloadPdf) {
        await downloadPdf(quotation.id_cotizacion);
      }
      
      // Navigate back to quotations list
      router.push("/cotizaciones");
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: "Error al crear la cotización: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
  
  const addNewItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0
    });
    
    // Switch to items tab
    setCurrentTab("items");
  };

  // Initialize filtered materials when originals load
  useEffect(() => {
    setFilteredTabletos(tabletosMaterials);
  }, [tabletosMaterials]);
  
  useEffect(() => {
    setFilteredChapacinta(chapacintaMaterials);
  }, [chapacintaMaterials]);
  
  useEffect(() => {
    setFilteredJaladera(jaladeraMaterials);
  }, [jaladeraMaterials]);
  
  useEffect(() => {
    setFilteredCorrederas(correderasMaterials);
  }, [correderasMaterials]);
  
  useEffect(() => {
    setFilteredBisagras(bisagrasMaterials);
  }, [bisagrasMaterials]);
  
  useEffect(() => {
    setFilteredTipOnLargo(tipOnLargoMaterials);
  }, [tipOnLargoMaterials]);
  
  // Filter materials when search terms change
  useEffect(() => {
    if (matHuacalSearch) {
      setFilteredTabletos(
        tabletosMaterials.filter(m => 
          m.nombre.toLowerCase().includes(matHuacalSearch.toLowerCase())
        )
      );
    } else {
      setFilteredTabletos(tabletosMaterials);
    }
  }, [matHuacalSearch, tabletosMaterials]);
  
  useEffect(() => {
    if (matVistaSearch) {
      setFilteredTabletos(
        tabletosMaterials.filter(m => 
          m.nombre.toLowerCase().includes(matVistaSearch.toLowerCase())
        )
      );
    } else {
      setFilteredTabletos(tabletosMaterials);
    }
  }, [matVistaSearch, tabletosMaterials]);
  
  useEffect(() => {
    if (chapHuacalSearch) {
      setFilteredChapacinta(
        chapacintaMaterials.filter(m => 
          m.nombre.toLowerCase().includes(chapHuacalSearch.toLowerCase())
        )
      );
    } else {
      setFilteredChapacinta(chapacintaMaterials);
    }
  }, [chapHuacalSearch, chapacintaMaterials]);
  
  useEffect(() => {
    if (chapVistaSearch) {
      setFilteredChapacinta(
        chapacintaMaterials.filter(m => 
          m.nombre.toLowerCase().includes(chapVistaSearch.toLowerCase())
        )
      );
    } else {
      setFilteredChapacinta(chapacintaMaterials);
    }
  }, [chapVistaSearch, chapacintaMaterials]);
  
  useEffect(() => {
    if (jaladeraSearch) {
      setFilteredJaladera(
        jaladeraMaterials.filter(m => 
          m.nombre.toLowerCase().includes(jaladeraSearch.toLowerCase())
        )
      );
    } else {
      setFilteredJaladera(jaladeraMaterials);
    }
  }, [jaladeraSearch, jaladeraMaterials]);
  
  useEffect(() => {
    if (correderaSearch) {
      setFilteredCorrederas(
        correderasMaterials.filter(m => 
          m.nombre.toLowerCase().includes(correderaSearch.toLowerCase())
        )
      );
    } else {
      setFilteredCorrederas(correderasMaterials);
    }
  }, [correderaSearch, correderasMaterials]);
  
  useEffect(() => {
    if (bisagrasSearch) {
      setFilteredBisagras(
        bisagrasMaterials.filter(m => 
          m.nombre.toLowerCase().includes(bisagrasSearch.toLowerCase())
        )
      );
    } else {
      setFilteredBisagras(bisagrasMaterials);
    }
  }, [bisagrasSearch, bisagrasMaterials]);
  
  useEffect(() => {
    if (tipOnLargoSearch) {
      setFilteredTipOnLargo(
        tipOnLargoMaterials.filter(m => 
          m.nombre.toLowerCase().includes(tipOnLargoSearch.toLowerCase())
        )
      );
    } else {
      setFilteredTipOnLargo(tipOnLargoMaterials);
    }
  }, [tipOnLargoSearch, tipOnLargoMaterials]);
  
  // Add watchers for form fields
  const clientTabWatch = form.watch(["clientName", "clientId"]);
  const projectTabWatch = form.watch(["projectName", "projectType", "vendedor", "fabricante", "instalador", "deliveryTime", "paymentTerms"]);
  
  // Compute validity of tabs
  const isClientTabValid = !!form.getValues("clientName") && !!form.getValues("clientId");
  const isProjectTabValid = !!form.getValues("projectName") && !!form.getValues("projectType") && 
                           !!form.getValues("vendedor") && !!form.getValues("fabricante") && 
                           !!form.getValues("instalador") && !!form.getValues("deliveryTime") && 
                           !!form.getValues("paymentTerms");

  // New function to fetch compatible cubrecantos for a selected tablero
  const fetchCompatibleCubrecantos = async (tableroId: string): Promise<any[]> => {
    if (!tableroId || tableroId === "none") {
      return chapacintaMaterials; // Return all cubrecantos if no tablero selected
    }
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // First get the relationship IDs
      const { data: relationships, error: relError } = await supabase
        .from('material_relationships')
        .select('material_id_secondary')
        .eq('material_id_primary', parseInt(tableroId))
        .eq('relationship_type', 'tablero_cubrecanto');
      
      if (relError) {
        console.error('Error fetching relationships:', relError);
        return chapacintaMaterials; // Fallback to all cubrecantos
      }
      
      if (!relationships || relationships.length === 0) {
        console.log('No relationships found for tablero', tableroId);
        return chapacintaMaterials; // Return all if no specific relationships
      }
      
      // Extract the IDs
      const compatibleIds = relationships.map(rel => rel.material_id_secondary);
      
      // Fetch the actual materials
      const { data: compatibleMaterials, error: matError } = await supabase
        .from('materiales')
        .select('*')
        .eq('tipo', 'Cubrecantos')
        .in('id_material', compatibleIds);
      
      if (matError) {
        console.error('Error fetching compatible materials:', matError);
        return chapacintaMaterials; // Fallback to all cubrecantos
      }
      
      console.log(`Found ${compatibleMaterials?.length || 0} compatible cubrecantos for tablero ${tableroId}`);
      return compatibleMaterials || [];
      
    } catch (error) {
      console.error('Error in fetchCompatibleCubrecantos:', error);
      return chapacintaMaterials; // Fallback to all cubrecantos
    }
  };

  // State for compatible cubrecantos
  const [compatibleCubrecantos, setCompatibleCubrecantos] = useState<any[]>([]);

  // Update compatible cubrecantos when tablero selection changes
  useEffect(() => {
    const updateCompatibleCubrecantos = async () => {
      const matHuacalId = form.getValues('matHuacal');
      if (!matHuacalId) return; // Exit early if no value
      
      const compatible = await fetchCompatibleCubrecantos(matHuacalId);
      setCompatibleCubrecantos(compatible);
      
      // Reset cubrecanto selection if current selection is not compatible
      const currentChapHuacal = form.getValues('chapHuacal');
      if (currentChapHuacal && currentChapHuacal !== "none") {
        const isCompatible = compatible.some(c => c.id_material.toString() === currentChapHuacal);
        if (!isCompatible) {
          form.setValue('chapHuacal', 'none');
          console.log('Reset chapHuacal selection due to incompatibility');
        }
      }
    };
    
    updateCompatibleCubrecantos();
  }, [form.watch('matHuacal')]);

  // Filter functions for material search
  const getFilteredTableros = () => {
    if (!matHuacalSearch.trim() && !matVistaSearch.trim()) return tabletosMaterials;
    const searchTerm = matHuacalSearch || matVistaSearch;
    return tabletosMaterials.filter(material => 
      material.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredCubrecantos = () => {
    let materialsToFilter = compatibleCubrecantos.length > 0 ? compatibleCubrecantos : chapacintaMaterials;
    if (!chapHuacalSearch.trim() && !chapVistaSearch.trim()) return materialsToFilter;
    const searchTerm = chapHuacalSearch || chapVistaSearch;
    return materialsToFilter.filter(material => 
      material.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredJaladeras = () => {
    if (!jaladeraSearch.trim()) return jaladeraMaterials;
    return jaladeraMaterials.filter(material => 
      material.nombre.toLowerCase().includes(jaladeraSearch.toLowerCase())
    );
  };

  const getFilteredCorrederas = () => {
    if (!correderaSearch.trim()) return correderasMaterials;
    return correderasMaterials.filter(material => 
      material.nombre.toLowerCase().includes(correderaSearch.toLowerCase())
    );
  };

  const getFilteredBisagras = () => {
    if (!bisagrasSearch.trim()) return bisagrasMaterials;
    return bisagrasMaterials.filter(material => 
      material.nombre.toLowerCase().includes(bisagrasSearch.toLowerCase())
    );
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Nueva Cotización (Simplificada)</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cotizaciones">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="client">Cliente</TabsTrigger>
                  <TabsTrigger value="project">Proyecto</TabsTrigger>
                  <TabsTrigger 
                    value="materials"
                    onMouseEnter={() => {
                      // Preload materials data when user hovers over tab
                      if (isLoadingMaterials && tabletosMaterials.length === 0) {
                        console.log("Preloading materials data on hover");
                      }
                    }}
                  >
                    Materiales
                    {isLoadingMaterials && (
                      <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="items">Productos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="client" className="space-y-3 mt-3">
                  <h3 className="text-base font-medium text-slate-800 mb-3">Información del Cliente</h3>
                  
                  <div className="p-4 bg-white rounded-md border border-slate-200/60 shadow-sm">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-xs font-medium text-slate-700">Seleccionar Cliente</Label>
                        <Button 
                          type="button" 
                          onClick={() => setShowClientModal(true)} 
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs bg-white hover:bg-slate-50 border-slate-300"
                        >
                          <Plus className="h-3 w-3 mr-1 text-slate-600" /> Agregar
                        </Button>
                      </div>
                      <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openClientCombobox}
                            className="w-full md:w-[calc(50%-8px)] justify-between h-8 text-xs font-normal text-slate-700 border-slate-300 hover:border-slate-400"
                          >
                            {form.watch('clientName') || "Seleccionar cliente..."}
                            <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0" align="start">
                          <div className="max-h-[300px] overflow-y-auto p-3">
                            {isLoadingClients ? (
                              <div className="py-6 text-center">
                                <Loader2 className="h-5 w-5 mx-auto animate-spin text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">Cargando clientes...</p>
                              </div>
                            ) : clients.length === 0 ? (
                              <div className="py-6 text-center">
                                <p className="text-sm text-gray-500">No se encontraron clientes</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {clients.map(client => (
                                  <div key={client.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer" onClick={() => handleClientSelect(client.id.toString())}>
                                    <div className="flex flex-col flex-1">
                                      <span className="font-medium">{client.name}</span>
                                      {client.email && (
                                        <span className="text-xs text-muted-foreground">{client.email}</span>
                                      )}
                                    </div>
                                    <ChevronDown className="h-4 w-4 rotate-[-90deg] text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <FormField
                          control={form.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Nombre</FormLabel>
                              <FormControl>
                                <div className="p-2 border rounded text-xs bg-slate-50 text-slate-700 border-slate-200">
                                  {field.value || 'No seleccionado'}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={form.control}
                          name="clientEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Correo electrónico</FormLabel>
                              <FormControl>
                                <div className="p-2 border rounded text-xs bg-slate-50 text-slate-700 border-slate-200">
                                  {field.value || 'No disponible'}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={form.control}
                          name="clientPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Teléfono</FormLabel>
                              <FormControl>
                                <div className="p-2 border rounded text-xs bg-slate-50 text-slate-700 border-slate-200">
                                  {field.value || 'No disponible'}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={form.control}
                          name="clientAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Dirección</FormLabel>
                              <FormControl>
                                <div className="p-2 border rounded text-xs bg-slate-50 text-slate-700 border-slate-200">
                                  {field.value || 'No disponible'}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="project" className="space-y-3 mt-3">
                  <h3 className="text-base font-medium text-slate-800">Detalles del Proyecto</h3>
                  <Separator className="border-slate-200" />
                  
                  {/* Project Code Information Card */}
                  <div className="bg-blue-50/60 border border-blue-200/60 rounded-md p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium text-blue-800 mb-1">Código de Proyecto Automático</h4>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-5 px-1 text-xs">
                                <Info className="h-3 w-3 mr-0.5" />
                                Ayuda
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Sistema de Códigos de Proyecto</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Formato del Código de Proyecto:</h4>
                                  <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                                    [TIPO]-[FECHA]-[CONSECUTIVO]-[PROTOTIPO]
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="font-medium text-sm mb-1">Proyectos Residenciales:</h5>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <div>• <strong>TIPO:</strong> RE</div>
                                      <div>• <strong>Ejemplo:</strong> RE-505-001</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-medium text-sm mb-1">Proyectos Verticales:</h5>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <div>• <strong>TIPO:</strong> WN, SY, etc.</div>
                                      <div>• <strong>Ejemplo:</strong> WN-505-001-B1</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Códigos de Productos Individuales:</h4>
                                  <div className="bg-gray-50 p-3 rounded font-mono text-sm mb-2">
                                    [CODIGO_PROYECTO]-[AREA]-[MUEBLE][-TIPO_PRODUCCION]
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div>• <strong>ÁREA:</strong> CL (Closet), DP (Despensa), LV (Lavandería), etc.</div>
                                    <div>• <strong>MUEBLE:</strong> ALC (Alacena), GAB (Gabinete), CJN (Cajón), etc.</div>
                                    <div>• <strong>PRODUCCIÓN:</strong> A (Adicional), G (Garantía), vacío (Original)</div>
                                  </div>
                                </div>
                                
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                                  <h5 className="font-medium text-sm text-yellow-800 mb-1">Ejemplos Completos:</h5>
                                  <div className="text-sm text-yellow-700 space-y-1 font-mono">
                                    <div>RE-505-001-CL-ALC (Alacena original)</div>
                                    <div>WN-505-001-B1-CL-ALC-A (Alacena adicional)</div>
                                    <div>RE-505-002-DP-GAB-G (Gabinete garantía)</div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Se generará automáticamente un código único para este proyecto. 
                          <br />
                          <strong>Residencial:</strong> RE-{new Date().getFullYear().toString().slice(-1)}{(new Date().getMonth() + 1).toString().padStart(2, '0')}-001
                          <br />
                          <strong>Desarrollo:</strong> WN-{new Date().getFullYear().toString().slice(-1)}{(new Date().getMonth() + 1).toString().padStart(2, '0')}-001-{form.watch('prototipo') || 'B1'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">Nombre del Proyecto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Remodelación Cocina" {...field} className="h-8 text-xs border-slate-300" />
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
                          <FormLabel className="text-xs font-medium text-slate-700">Tipo de Proyecto</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 text-xs border-slate-300">
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIPOS_PROYECTO.map((tipo) => (
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
                    
                    {/* Prototipo field - only show for vertical projects */}
                    {form.watch('projectType') === '3' && (
                      <FormField
                        control={form.control}
                        name="prototipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prototipo</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej. B1, A2, PH" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500">
                              Código del prototipo para proyectos verticales (ej. B1, A2, PH)
                            </p>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cotizacionDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha</FormLabel>
                          <Popover open={isCotizacionDateOpen} onOpenChange={setIsCotizacionDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                    "border-gray-300 hover:border-gray-400 transition-colors rounded-md"
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
                              <DayPicker
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
                                disabled={[{ before: new Date("1900-01-01") }]}
                                locale={es}
                                showOutsideDays
                                className="p-3"
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
                        <FormItem>
                          <FormLabel>Válido Hasta</FormLabel>
                          <Popover open={isValidUntilOpen} onOpenChange={setIsValidUntilOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                    "border-gray-300 hover:border-gray-400 transition-colors rounded-md"
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
                            <PopoverContent className="w-auto p-0 rounded-lg shadow-md border border-gray-200" align="start">
                              <DayPicker
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setIsValidUntilOpen(false);
                                }}
                                disabled={[{ before: new Date() }]}
                                locale={es}
                                showOutsideDays
                                className="p-3"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="deliveryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo de Entrega (días)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
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
                          <Input placeholder="Ej. 50% anticipo, 50% contra entrega" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <h3 className="text-lg font-medium mt-6">Equipo</h3>
                  <Separator className="mb-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="vendedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendedor</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar vendedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {VENDEDORES.map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name}
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
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar fabricante" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FABRICANTES.map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name}
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
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar instalador" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INSTALADORES.map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="materials" className="space-y-4 mt-4">
                  <h3 className="text-lg font-medium">Selección de Materiales</h3>
                  <Separator />
                  
                  {isLoadingMaterials ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Cargando materiales...</span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-sm">
                        <p>Los materiales seleccionados afectan directamente al cálculo de precios de los productos. El sistema mostrará solo cubrecantos compatibles con el tablero seleccionado.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tablero Huacal */}
                        <FormField
                          control={form.control}
                          name="matHuacal"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Tablero Huacal ({tabletosMaterials.length} disponibles)</FormLabel>
                              <Popover open={openMatHuacalCombobox} onOpenChange={setOpenMatHuacalCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openMatHuacalCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? tabletosMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Seleccionar tablero..."}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 max-h-[300px]" align="start">
                                  <Command className="max-h-[300px]">
                                    <CommandInput 
                                      placeholder="Buscar tablero..." 
                                      value={matHuacalSearch}
                                      onValueChange={setMatHuacalSearch}
                                    />
                                    {getFilteredTableros().length === 0 && matHuacalSearch && (
                                      <CommandEmpty>No se encontraron tableros.</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange("none");
                                          setOpenMatHuacalCombobox(false);
                                          setMatHuacalSearch("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex w-full items-center justify-between p-2">
                                          <span className="font-medium">Ninguno</span>
                                        </div>
                                      </CommandItem>
                                      {getFilteredTableros().map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={`${material.nombre}-${material.id_material}`}
                                          onSelect={() => {
                                            field.onChange(material.id_material.toString());
                                            setOpenMatHuacalCombobox(false);
                                            setMatHuacalSearch("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex w-full items-center justify-between p-2">
                                            <span className="font-medium text-left flex-1">
                                              <HighlightedText 
                                                text={material.nombre} 
                                                query={matHuacalSearch} 
                                              />
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                                              ${material.costo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Tablero Vista */}
                        <FormField
                          control={form.control}
                          name="matVista"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Tablero Vista ({tabletosMaterials.length} disponibles)</FormLabel>
                              <Popover open={openMatVistaCombobox} onOpenChange={setOpenMatVistaCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openMatVistaCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? tabletosMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Seleccionar tablero..."}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 max-h-[300px]" align="start">
                                  <Command className="max-h-[300px]">
                                    <CommandInput 
                                      placeholder="Buscar tablero..." 
                                      value={matVistaSearch}
                                      onValueChange={setMatVistaSearch}
                                    />
                                    {getFilteredTableros().length === 0 && matVistaSearch && (
                                      <CommandEmpty>No se encontraron tableros.</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange("none");
                                          setOpenMatVistaCombobox(false);
                                          setMatVistaSearch("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex w-full items-center justify-between p-2">
                                          <span className="font-medium">Ninguno</span>
                                        </div>
                                      </CommandItem>
                                      {getFilteredTableros().map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={`${material.nombre}-${material.id_material}`}
                                          onSelect={() => {
                                            field.onChange(material.id_material.toString());
                                            setOpenMatVistaCombobox(false);
                                            setMatVistaSearch("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex w-full items-center justify-between p-2">
                                            <span className="font-medium text-left flex-1">
                                              <HighlightedText 
                                                text={material.nombre} 
                                                query={matVistaSearch} 
                                              />
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                                              ${material.costo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Cubrecanto Huacal */}
                        <FormField
                          control={form.control}
                          name="chapHuacal"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>
                                Cubrecanto Huacal 
                                ({compatibleCubrecantos.length > 0 
                                  ? `${compatibleCubrecantos.length} compatibles` 
                                  : `${chapacintaMaterials.length} disponibles`})
                              </FormLabel>
                              <Popover open={openChapHuacalCombobox} onOpenChange={setOpenChapHuacalCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openChapHuacalCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? (compatibleCubrecantos.length > 0 ? compatibleCubrecantos : chapacintaMaterials).find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Seleccionar cubrecanto..."}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 max-h-[300px]" align="start">
                                  <Command className="max-h-[300px]">
                                    <CommandInput 
                                      placeholder="Buscar cubrecanto..." 
                                      value={chapHuacalSearch}
                                      onValueChange={setChapHuacalSearch}
                                    />
                                    {getFilteredCubrecantos().length === 0 && chapHuacalSearch && (
                                      <CommandEmpty>No se encontraron cubrecantos compatibles.</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange("none");
                                          setOpenChapHuacalCombobox(false);
                                          setChapHuacalSearch("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex w-full items-center justify-between p-2">
                                          <span className="font-medium">Ninguno</span>
                                        </div>
                                      </CommandItem>
                                      {getFilteredCubrecantos().map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={`${material.nombre}-${material.id_material}`}
                                          onSelect={() => {
                                            field.onChange(material.id_material.toString());
                                            setOpenChapHuacalCombobox(false);
                                            setChapHuacalSearch("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex w-full items-center justify-between p-2">
                                            <span className="font-medium text-left flex-1">
                                              <HighlightedText 
                                                text={material.nombre} 
                                                query={chapHuacalSearch} 
                                              />
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                                              ${material.costo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Cubrecanto Vista */}
                        <FormField
                          control={form.control}
                          name="chapVista"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>
                                Cubrecanto Vista 
                                ({compatibleCubrecantos.length > 0 
                                  ? `${compatibleCubrecantos.length} compatibles` 
                                  : `${chapacintaMaterials.length} disponibles`})
                              </FormLabel>
                              <Popover open={openChapVistaCombobox} onOpenChange={setOpenChapVistaCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openChapVistaCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? (compatibleCubrecantos.length > 0 ? compatibleCubrecantos : chapacintaMaterials).find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Seleccionar cubrecanto..."}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 max-h-[300px]" align="start">
                                  <Command className="max-h-[300px]">
                                    <CommandInput 
                                      placeholder="Buscar cubrecanto..." 
                                      value={chapVistaSearch}
                                      onValueChange={setChapVistaSearch}
                                    />
                                    {getFilteredCubrecantos().length === 0 && chapVistaSearch && (
                                      <CommandEmpty>No se encontraron cubrecantos compatibles.</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange("none");
                                          setOpenChapVistaCombobox(false);
                                          setChapVistaSearch("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex w-full items-center justify-between p-2">
                                          <span className="font-medium">Ninguno</span>
                                        </div>
                                      </CommandItem>
                                      {getFilteredCubrecantos().map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={`${material.nombre}-${material.id_material}`}
                                          onSelect={() => {
                                            field.onChange(material.id_material.toString());
                                            setOpenChapVistaCombobox(false);
                                            setChapVistaSearch("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex w-full items-center justify-between p-2">
                                            <span className="font-medium text-left flex-1">
                                              <HighlightedText 
                                                text={material.nombre} 
                                                query={chapVistaSearch} 
                                              />
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                                              ${material.costo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Jaladera */}
                        <FormField
                          control={form.control}
                          name="jaladera"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Jaladera ({jaladeraMaterials.length} disponibles)</FormLabel>
                              <Popover open={openJaladeraCombobox} onOpenChange={setOpenJaladeraCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openJaladeraCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? jaladeraMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Seleccionar jaladera..."}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 max-h-[300px]" align="start">
                                  <Command className="max-h-[300px]">
                                    <CommandInput 
                                      placeholder="Buscar jaladera..." 
                                      value={jaladeraSearch}
                                      onValueChange={setJaladeraSearch}
                                    />
                                    {getFilteredJaladeras().length === 0 && jaladeraSearch && (
                                      <CommandEmpty>No se encontraron jaladeras.</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange("none");
                                          setOpenJaladeraCombobox(false);
                                          setJaladeraSearch("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex w-full items-center justify-between p-2">
                                          <span className="font-medium">Ninguno</span>
                                        </div>
                                      </CommandItem>
                                      {getFilteredJaladeras().map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={`${material.nombre}-${material.id_material}`}
                                          onSelect={() => {
                                            field.onChange(material.id_material.toString());
                                            setOpenJaladeraCombobox(false);
                                            setJaladeraSearch("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex w-full items-center justify-between p-2">
                                            <span className="font-medium text-left flex-1">
                                              <HighlightedText 
                                                text={material.nombre} 
                                                query={jaladeraSearch} 
                                              />
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                                              ${material.costo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Corredera */}
                        <FormField
                          control={form.control}
                          name="corredera"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Corredera ({correderasMaterials.length} disponibles)</FormLabel>
                              <Popover open={openCorrederaCombobox} onOpenChange={setOpenCorrederaCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openCorrederaCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? correderasMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Seleccionar corredera..."}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 max-h-[300px]" align="start">
                                  <Command className="max-h-[300px]">
                                    <CommandInput 
                                      placeholder="Buscar corredera..." 
                                      value={correderaSearch}
                                      onValueChange={setCorrederaSearch}
                                    />
                                    {getFilteredCorrederas().length === 0 && correderaSearch && (
                                      <CommandEmpty>No se encontraron correderas.</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange("none");
                                          setOpenCorrederaCombobox(false);
                                          setCorrederaSearch("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex w-full items-center justify-between p-2">
                                          <span className="font-medium">Ninguno</span>
                                        </div>
                                      </CommandItem>
                                      {getFilteredCorrederas().map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={`${material.nombre}-${material.id_material}`}
                                          onSelect={() => {
                                            field.onChange(material.id_material.toString());
                                            setOpenCorrederaCombobox(false);
                                            setCorrederaSearch("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex w-full items-center justify-between p-2">
                                            <span className="font-medium text-left flex-1">
                                              <HighlightedText 
                                                text={material.nombre} 
                                                query={correderaSearch} 
                                              />
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                                              ${material.costo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Bisagras */}
                        <FormField
                          control={form.control}
                          name="bisagras"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Bisagras ({bisagrasMaterials.length} disponibles)</FormLabel>
                              <Popover open={openBisagrasCombobox} onOpenChange={setOpenBisagrasCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openBisagrasCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? bisagrasMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Seleccionar bisagra..."}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 max-h-[300px]" align="start">
                                  <Command className="max-h-[300px]">
                                    <CommandInput 
                                      placeholder="Buscar bisagra..." 
                                      value={bisagrasSearch}
                                      onValueChange={setBisagrasSearch}
                                    />
                                    {getFilteredBisagras().length === 0 && bisagrasSearch && (
                                      <CommandEmpty>No se encontraron bisagras.</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange("none");
                                          setOpenBisagrasCombobox(false);
                                          setBisagrasSearch("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex w-full items-center justify-between p-2">
                                          <span className="font-medium">Ninguno</span>
                                        </div>
                                      </CommandItem>
                                      {getFilteredBisagras().map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={`${material.nombre}-${material.id_material}`}
                                          onSelect={() => {
                                            field.onChange(material.id_material.toString());
                                            setOpenBisagrasCombobox(false);
                                            setBisagrasSearch("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex w-full items-center justify-between p-2">
                                            <span className="font-medium text-left flex-1">
                                              <HighlightedText 
                                                text={material.nombre} 
                                                query={bisagrasSearch} 
                                              />
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                                              ${material.costo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Material Compatibility Info */}
                      {form.getValues('matHuacal') && form.getValues('matHuacal') !== "none" && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                          <h4 className="font-medium text-green-800 mb-2">Compatibilidad de Materiales</h4>
                          <p className="text-sm text-green-700">
                            {compatibleCubrecantos.length > 0 
                              ? `Se encontraron ${compatibleCubrecantos.length} cubrecantos compatibles con el tablero seleccionado.`
                              : "No se han definido compatibilidades específicas para este tablero. Se muestran todos los cubrecantos."}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="items" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Productos/Artículos</h3>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        onClick={() => setShowInventorySearch(true)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  
                  {fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay productos en esta cotización.
                      <div className="mt-2">
                        <Button 
                          type="button" 
                          onClick={() => setShowInventorySearch(true)} 
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">Descripción</TableHead>
                            <TableHead className="w-[100px]">Área</TableHead>
                            <TableHead className="w-[120px]">Tipo Mueble</TableHead>
                            <TableHead className="w-[100px]">Producción</TableHead>
                            <TableHead className="w-[140px]">Código</TableHead>
                            <TableHead className="text-right">Cant.</TableHead>
                            <TableHead className="text-right">U TL</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Desc. (%)</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.description`}
                                  render={({ field }) => (
                                    <Input 
                                      {...field} 
                                      placeholder="Descripción" 
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.area`}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Área" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(AREAS).map(([name, code]) => (
                                          <SelectItem key={code} value={code}>
                                            {code} - {name.toLowerCase().replace(/_/g, ' ')}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.furnitureType`}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(FURNITURE_TYPES).map(([name, code]) => (
                                          <SelectItem key={code} value={code}>
                                            {code} - {name.toLowerCase().replace(/_/g, ' ')}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.productionType`}
                                  render={({ field }) => (
                                    <Select 
                                      onValueChange={field.onChange} 
                                      value={field.value || 'original'}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="original">Original</SelectItem>
                                        <SelectItem value="additional">Adicional</SelectItem>
                                        <SelectItem value="warranty">Garantía</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-xs bg-gray-50 border rounded px-2 py-1">
                                  {(() => {
                                    const item = form.getValues(`items.${index}`);
                                    const projectType = form.getValues('projectType');
                                    const prototipo = form.getValues('prototipo');
                                    const cotizacionDate = form.getValues('cotizacionDate');
                                    
                                    if (!item.area || !item.furnitureType) {
                                      return <span className="text-gray-400">Sin código</span>;
                                    }
                                    
                                    try {
                                      const config: FurnitureCodeConfig = {
                                        projectType: projectType === '1' ? 'residencial' : 'vertical',
                                        verticalProject: projectType === '3' ? 'WN' : undefined,
                                        date: cotizacionDate,
                                        consecutiveNumber: 1, // This will be updated when project code is generated
                                        prototipo: projectType === '3' ? prototipo : undefined,
                                        area: item.area,
                                        muebleType: item.furnitureType,
                                        productionType: item.productionType === 'additional' ? 'A' : 
                                                       item.productionType === 'warranty' ? 'G' : undefined
                                      };
                                      
                                      const code = generateFurnitureCode(config);
                                      return <span className="text-blue-600">{code}</span>;
                                    } catch (error) {
                                      return <span className="text-red-400">Error</span>;
                                    }
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      className="w-20 text-right ml-auto"
                                      min={1}
                                      onChange={e => {
                                        const value = parseInt(e.target.value) || 1;
                                        field.onChange(value);
                                        handleItemValueChange(index, 'quantity', value);
                                      }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.furnitureData.u_tl`}
                                  render={({ field }) => (
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      className="w-20 text-right ml-auto"
                                      min={0}
                                      step={0.01}
                                      placeholder="0"
                                      onChange={e => {
                                        const value = parseFloat(e.target.value) || 0;
                                        field.onChange(value);
                                        // Recalculate price when U TL changes
                                        setTimeout(calculateTotals, 10);
                                      }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unitPrice`}
                                  render={({ field }) => (
                                    <div className="flex items-center justify-end">
                                      <span className="mr-1 text-muted-foreground">$</span>
                                      <Input 
                                        {...field} 
                                        type="number" 
                                        className="w-24 text-right"
                                        min={0}
                                        step={0.01}
                                        onChange={e => {
                                          const value = parseFloat(e.target.value) || 0;
                                          field.onChange(value);
                                          handleItemValueChange(index, 'unitPrice', value);
                                        }}
                                      />
                                    </div>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.discount`}
                                  render={({ field }) => (
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      className="w-20 text-right ml-auto"
                                      min={0}
                                      max={100}
                                      onChange={e => {
                                        const value = parseFloat(e.target.value) || 0;
                                        field.onChange(value);
                                        handleItemValueChange(index, 'discount', value);
                                      }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {(() => {
                                  const item = form.getValues(`items.${index}`);
                                  if (!item) return "—";
                                  const quantity = Number(item.quantity) || 0;
                                  const price = Number(item.unitPrice) || 0;
                                  const discount = Number(item.discount) || 0;
                                  const total = quantity * price * (1 - discount / 100);
                                  return formatCurrency(total);
                                })()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    remove(index);
                                    setTimeout(calculateTotals, 10);
                                  }}
                                  size="icon"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {/* Display the calculated totals */}
                  <div className="rounded-md border mt-8 p-4">
                    <div className="flex justify-end">
                      <div className="w-64">
                        <h3 className="text-base font-medium mb-2">Totales</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <div className="text-sm text-gray-500">Subtotal</div>
                            <div className="text-sm font-medium">{formatCurrency(totals.subtotal)}</div>
                          </div>
                          <div className="flex justify-between">
                            <div className="text-sm text-gray-500">IVA (16%)</div>
                            <div className="text-sm font-medium">{formatCurrency(totals.tax)}</div>
                          </div>
                          <div className="pt-2 border-t flex justify-between">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-base font-bold">{formatCurrency(totals.total)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Debug Calculations Section */}
                  {fields.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-medium">Desglose de Cálculos</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDebugCalculations(!showDebugCalculations)}
                        >
                          {showDebugCalculations ? "Ocultar" : "Mostrar"} Cálculos
                        </Button>
                      </div>
                      
                      {showDebugCalculations && (
                        <div id="debug-section" className="rounded-md border p-4 bg-gray-50">
                          <div className="space-y-6">
                            {/* Project Info */}
                            <div className="text-sm">
                              <div className="font-medium mb-2">Información del Proyecto:</div>
                              <div className="grid grid-cols-2 gap-4 text-gray-600">
                                <div>Tipo: {form.getValues('projectType') === "1" ? "Residencial (180%)" : form.getValues('projectType') === "3" ? "Desarrollo (150%)" : "Otro (100%)"}</div>
                                <div>Multiplicador: {form.getValues('projectType') === "1" ? "1.8x" : form.getValues('projectType') === "3" ? "1.5x" : "1.0x"}</div>
                              </div>
                            </div>
                            
                            {/* Materials Info */}
                            <div className="text-sm">
                              <div className="font-medium mb-2">Materiales Seleccionados:</div>
                              <div className="grid grid-cols-2 gap-2 text-gray-600">
                                {form.getValues('matHuacal') !== "none" && (
                                  <div>Mat. Huacal: {tabletosMaterials.find(m => m.id_material.toString() === form.getValues('matHuacal'))?.nombre || "N/A"}</div>
                                )}
                                {form.getValues('matVista') !== "none" && (
                                  <div>Mat. Vista: {tabletosMaterials.find(m => m.id_material.toString() === form.getValues('matVista'))?.nombre || "N/A"}</div>
                                )}
                                {form.getValues('chapHuacal') !== "none" && (
                                  <div>Chap. Huacal: {chapacintaMaterials.find(m => m.id_material.toString() === form.getValues('chapHuacal'))?.nombre || "N/A"}</div>
                                )}
                                {form.getValues('chapVista') !== "none" && (
                                  <div>Chap. Vista: {chapacintaMaterials.find(m => m.id_material.toString() === form.getValues('chapVista'))?.nombre || "N/A"}</div>
                                )}
                                {form.getValues('jaladera') !== "none" && (
                                  <div>Jaladera: {jaladeraMaterials.find(m => m.id_material.toString() === form.getValues('jaladera'))?.nombre || "N/A"}</div>
                                )}
                                {form.getValues('corredera') !== "none" && (
                                  <div>Corredera: {correderasMaterials.find(m => m.id_material.toString() === form.getValues('corredera'))?.nombre || "N/A"}</div>
                                )}
                                {form.getValues('bisagras') !== "none" && (
                                  <div>Bisagras: {bisagrasMaterials.find(m => m.id_material.toString() === form.getValues('bisagras'))?.nombre || "N/A"}</div>
                                )}
                                {form.getValues('tipOnLargo') !== "none" && (
                                  <div>Tip-on Largo: {tipOnLargoMaterials.find(m => m.id_material.toString() === form.getValues('tipOnLargo'))?.nombre || "N/A"}</div>
                                )}
                              </div>
                            </div>
                            
                            {/* Item Calculations */}
                            <div>
                              <div className="font-medium mb-3">Desglose por Artículo:</div>
                              <div className="space-y-4">
                                {getDebugCalculations().map((item) => (
                                  <div key={item.index} className="border rounded-md p-3 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium text-sm">
                                        {item.index + 1}. {item.description || "Sin descripción"}
                                      </div>
                                      {item.hasDiscrepancy && (
                                        <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                          ⚠️ Discrepancia
                                        </div>
                                      )}
                                    </div>
                                    
                                    {item.components.length > 0 ? (
                                      <div className="space-y-1">
                                        {item.components.map((component, idx) => (
                                          <div key={idx} className="text-xs text-gray-600 flex justify-between">
                                            <div className="flex-1">
                                              <span className="font-medium">{component.name}:</span> {component.material}
                                            </div>
                                            <div className="text-right">
                                              {component.quantity} × ${component.unitCost} × {component.multiplier} = ${component.total.toFixed(2)}
                                            </div>
                                          </div>
                                        ))}
                                        
                                        <div className="border-t pt-2 mt-2">
                                          <div className="flex justify-between text-sm">
                                            <div>Precio Calculado:</div>
                                            <div className="font-medium">${item.calculatedPrice.toFixed(2)}</div>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <div>Precio Almacenado:</div>
                                            <div className={item.hasDiscrepancy ? "text-red-600 font-medium" : ""}>${item.storedPrice.toFixed(2)}</div>
                                          </div>
                                          {item.hasDiscrepancy && (
                                            <div className="flex justify-between text-xs text-red-600">
                                              <div>Diferencia:</div>
                                              <div>${Math.abs(item.calculatedPrice - item.storedPrice).toFixed(2)}</div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="border-t pt-2 mt-2 bg-gray-50 rounded p-2">
                                          <div className="text-xs text-gray-600 space-y-1">
                                            <div className="flex justify-between">
                                              <div>Cantidad:</div>
                                              <div>{item.quantity || 1}</div>
                                            </div>
                                            <div className="flex justify-between">
                                              <div>Descuento:</div>
                                              <div>{item.discount || 0}%</div>
                                            </div>
                                            <div className="flex justify-between font-medium">
                                              <div>Subtotal Final:</div>
                                              <div>${((item.quantity || 1) * item.storedPrice * (1 - (item.discount || 0) / 100)).toFixed(2)}</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">
                                        No hay datos de mueble para calcular componentes
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Summary */}
                            <div className="border-t pt-4">
                              <div className="font-medium mb-2">Resumen de Totales:</div>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <div>Subtotal (sin IVA):</div>
                                  <div>${totals.subtotal.toFixed(2)}</div>
                                </div>
                                <div className="flex justify-between">
                                  <div>IVA (16%):</div>
                                  <div>${totals.tax.toFixed(2)}</div>
                                </div>
                                <div className="flex justify-between font-medium border-t pt-1">
                                  <div>Total:</div>
                                  <div>${totals.total.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Add notes field */}
                  <div className="mt-6">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas adicionales</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observaciones, comentarios o detalles adicionales para esta cotización" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/cotizaciones">Cancelar</Link>
                </Button>
                {currentTab === "items" ? (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || fields.length === 0}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Generar Cotización"
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    disabled={
                      (currentTab === "client" && !isClientTabValid) || 
                      (currentTab === "project" && !isProjectTabValid)
                    }
                    onClick={() => {
                      if (currentTab === "client") {
                        form.trigger(["clientName", "clientEmail", "clientPhone", "clientAddress"])
                          .then(isValid => {
                            if (isValid) setCurrentTab("project");
                          });
                      } else if (currentTab === "project") {
                        form.trigger(["projectName", "projectType", "vendedor", "fabricante", "instalador"])
                          .then(isValid => {
                            if (isValid) setCurrentTab("materials");
                          });
                      } else if (currentTab === "materials") {
                        // No validation needed for materials since they're optional
                        setCurrentTab("items");
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Continuar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Inventory Search Dialog */}
      <Dialog open={showInventorySearch} onOpenChange={(open) => {
        setShowInventorySearch(open);
        if (!open) {
          // Reset search state when dialog is closed
          setInventorySearchQuery("");
          setSelectedCategory('');
          setInventoryItems([]);
          setCurrentPage(0);
          setHasMoreItems(true);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>
              Busque productos por categoría y descripción. {totalCount > 0 && `Total: ${totalCount.toLocaleString()} productos`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-hidden max-h-[60vh] flex flex-col">
            {/* Category Selection */}
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-sm font-medium">Categoría</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value === "all" ? '' : value);
                  setInventorySearchQuery('');
                  if (value && value !== "all") {
                    fetchInventory('', value, 0, false);
                  } else {
                    setInventoryItems([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-sm font-medium">Búsqueda</Label>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder={selectedCategory 
                    ? `Buscar en ${selectedCategory}...` 
                    : "Buscar producto (mín. 2 caracteres)..."
                  }
                  value={inventorySearchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInventorySearchQuery(value);
                    
                    // Auto-search with simple timeout
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    
                    searchTimeoutRef.current = setTimeout(() => {
                      if (selectedCategory || value.length >= 2) {
                        fetchInventory(value, selectedCategory, 0, false);
                      }
                    }, 500);
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={() => fetchInventory(inventorySearchQuery, selectedCategory, 0, false)}
                  variant="outline"
                  size="icon"
                  disabled={isLoadingInventory || (!selectedCategory && inventorySearchQuery.length < 2)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Results */}
            <div className="flex-1 min-h-0 space-y-2">
              {!selectedCategory && inventorySearchQuery.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Seleccione una categoría o busque un producto</p>
                </div>
              ) : isLoadingInventory ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Cargando productos...</p>
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron productos</p>
                </div>
              ) : (
                <div className="space-y-2 h-full flex flex-col">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {inventoryItems.length} de {totalCount.toLocaleString()} productos
                  </p>
                  
                  <div className="border rounded-lg bg-white flex-1 min-h-0 flex flex-col">
                    <div className="overflow-auto flex-1">
                      <Table className="w-full">
                        <TableHeader className="bg-gray-50/80">
                          <TableRow>
                            <TableHead className="w-[140px] font-semibold py-3 px-4">Categoría</TableHead>
                            <TableHead className="font-semibold py-3 px-4">Descripción</TableHead>
                            <TableHead className="w-[120px] text-center font-semibold py-3 px-4">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryItems.map((item) => (
                            <TableRow key={item.insumo_id} className="hover:bg-gray-50/50 border-b border-gray-100">
                              <TableCell className="font-medium text-blue-600 text-sm py-3 px-4">
                                {item.categoria}
                              </TableCell>
                              <TableCell className="text-sm py-3 px-4">
                                {selectedCategory && inventorySearchQuery 
                                  ? <HighlightedText text={item.descripcion} query={inventorySearchQuery} />
                                  : !selectedCategory && inventorySearchQuery
                                  ? <HighlightedText text={item.mueble || item.descripcion} query={inventorySearchQuery} />
                                  : item.descripcion
                                }
                              </TableCell>
                              <TableCell className="text-center py-3 px-4">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => addInventoryItem(item)}
                                  className="h-8 px-4 text-xs bg-gray-900 hover:bg-gray-800"
                                >
                                  Seleccionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Load More Button */}
                    {hasMoreItems && (
                      <div className="p-4 text-center border-t bg-gray-50/30">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={loadMoreItems}
                          disabled={isLoadingMore}
                          className="bg-white hover:bg-gray-50"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            `Cargar más (${totalCount - inventoryItems.length} restantes)`
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* New Client Modal */}
      <NewClientModal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSave={handleNewClient}
      />
    </>
  );
}

export default CotizacionForm;