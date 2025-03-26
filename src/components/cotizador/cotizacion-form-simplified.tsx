'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, CalendarIcon, Plus, Trash2, Loader2, Search, ChevronDown, Calculator } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createBrowserClient } from '@supabase/ssr';

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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

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
  clientId: z.number().optional(),
  clientName: z.string().min(1, { message: "Nombre del cliente requerido" }),
  clientEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  
  // Project Information
  projectName: z.string().min(1, { message: "Nombre del proyecto requerido" }),
  projectType: z.string().min(1, { message: "Tipo de proyecto requerido" }),
  cotizacionDate: z.date(),
  
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
      furnitureData: z.object({
        mueble_id: z.number().optional(),
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
      }).optional(),
    })
  ),
  
  // Notes
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof cotizacionFormSchema>;

const TIPOS_PROYECTO = [
  { id: "1", name: "Residencial" },
  { id: "2", name: "Comercial" },
  { id: "3", name: "Desarrollo" },
  { id: "4", name: "Institucional" },
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

export default function CotizacionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("client");
  
  // Material states
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [tabletosMaterials, setTabletosMaterials] = useState<any[]>([]);
  const [chapacintaMaterials, setChapacintaMaterials] = useState<any[]>([]);
  const [jaladeraMaterials, setJaladeraMaterials] = useState<any[]>([]);
  const [correderasMaterials, setCorrederasMaterials] = useState<any[]>([]);
  const [bisagrasMaterials, setBisagrasMaterials] = useState<any[]>([]);
  
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
  const [openCorrederasCombobox, setOpenCorrederasCombobox] = useState(false);
  const [openBisagrasCombobox, setOpenBisagrasCombobox] = useState(false);
  
  // Add states for filtered materials in search
  const [filteredTabletos, setFilteredTabletos] = useState<any[]>([]);
  const [filteredChapacinta, setFilteredChapacinta] = useState<any[]>([]);
  const [filteredJaladera, setFilteredJaladera] = useState<any[]>([]);
  const [filteredCorrederas, setFilteredCorrederas] = useState<any[]>([]);
  const [filteredBisagras, setFilteredBisagras] = useState<any[]>([]);
  
  // Add state for current search
  const [matHuacalSearch, setMatHuacalSearch] = useState("");
  const [matVistaSearch, setMatVistaSearch] = useState("");
  const [chapHuacalSearch, setChapHuacalSearch] = useState("");
  const [chapVistaSearch, setChapVistaSearch] = useState("");
  const [jaladeraSearch, setJaladeraSearch] = useState("");
  const [correderasSearch, setCorrederasSearch] = useState("");
  const [bisagrasSearch, setBisagrasSearch] = useState("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues: {
      clientId: undefined,
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      projectName: "",
      projectType: "Residencial",
      cotizacionDate: new Date(),
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
      deliveryTime: 30,
      paymentTerms: "50% anticipo, 50% contra entrega",
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
        
        // Fetch tabletos materials
        const { data: tabletosData, error: tabletosError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Tabletos')
          .order('nombre', { ascending: true });
          
        if (tabletosError) throw tabletosError;
        setTabletosMaterials(tabletosData || []);
        
        // Fetch chapacinta materials
        const { data: chapacintaData, error: chapacintaError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Chapacinta')
          .order('nombre', { ascending: true });
          
        if (chapacintaError) throw chapacintaError;
        setChapacintaMaterials(chapacintaData || []);
        
        // Fetch jaladera materials
        const { data: jaladeraData, error: jaladeraError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Jaladera')
          .order('nombre', { ascending: true });
          
        if (jaladeraError) throw jaladeraError;
        setJaladeraMaterials(jaladeraData || []);
        
        // Fetch correderas materials
        const { data: correderasData, error: correderasError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Correderas')
          .order('nombre', { ascending: true });
          
        if (correderasError) throw correderasError;
        setCorrederasMaterials(correderasData || []);
        
        // Fetch bisagras materials
        const { data: bisagrasData, error: bisagrasError } = await supabase
          .from('materiales')
          .select('*')
          .eq('tipo', 'Bisagras')
          .order('nombre', { ascending: true });
          
        if (bisagrasError) throw bisagrasError;
        setBisagrasMaterials(bisagrasData || []);
        
        console.log("Materials loaded successfully");
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

  // Watch for changes to items to update totals
  form.watch((value, { name }) => {
    if (name?.startsWith('items')) {
      calculateTotals();
    }
  });

  // Initialize totals when component mounts
  useEffect(() => {
    calculateTotals();
  }, []);

  // Fetch inventory items
  const fetchInventory = useCallback(async (searchQuery = '') => {
    setIsLoadingInventory(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      let query = supabase
        .from('inventario')
        .select('*');
      
      // Add search filter if query is provided
      if (searchQuery && searchQuery.length >= 2) {
        query = query.ilike('nombre_mueble', `%${searchQuery}%`);
      }
      
      // Add pagination and ordering
      query = query.order('nombre_mueble').limit(20);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching inventory items:', error);
        return;
      }
      
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error in fetchInventory:', error);
      // Set mock data if there's an error
      setInventoryItems([
        { mueble_id: 1, nombre_mueble: 'Alacena 60x30x70', mat_huacal: 0.5, mat_vista: 0.6, chap_huacal: 2.5, chap_vista: 3 },
        { mueble_id: 2, nombre_mueble: 'Base 90x60x85', mat_huacal: 0.8, mat_vista: 0.9, chap_huacal: 3.5, chap_vista: 4 },
      ]);
    } finally {
      setIsLoadingInventory(false);
    }
  }, []);
  
  // Add function to add an inventory item
  const addInventoryItem = (item: any) => {
    console.log("Adding inventory item:", item);
    
    // Create furniture data object with all possible fields from inventory
    const furnitureData = {
      mueble_id: item.mueble_id,
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
    
    console.log("Selected material IDs:", {
      matHuacalId, matVistaId, chapHuacalId, chapVistaId, jaladeraId, correderaId, bisagrasId
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
    
    // Default cost values for fixed materials that are not selectable
    const DEFAULT_PATAS_COST = 10;
    const DEFAULT_CLIP_PATAS_COST = 2;
    const DEFAULT_MENSULAS_COST = 0.9;
    const DEFAULT_KIT_TORNILLO_COST = 30;
    const DEFAULT_CIF_COST = 100;
    
    console.log("Material objects:", {
      matHuacalMaterial, matVistaMaterial, chapHuacalMaterial, chapVistaMaterial, 
      jaladeraMaterial, correderaMaterial, bisagrasMaterial
    });
    
    // Apply multiplier based on project type
    const projectType = form.getValues('projectType');
    let multiplier = 1;
    
    // Set multiplier based on project type
    if (projectType === "Residencial") {
      multiplier = 1.8; // 180%
    } else if (projectType === "Desarrollo") {
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
      console.log(`Mensulas: ${furnitureData.mensulas} * ${DEFAULT_MENSULAS_COST} * ${multiplier} = ${componentPrice}`);
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
      description: item.nombre_mueble,
      quantity: 1,
      unitPrice: price,
      discount: 0,
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
    
    // Give React time to update the DOM before switching tabs
    setTimeout(() => {
      // Switch to items tab
      setCurrentTab("items");
      // Log the final state for debugging
      console.log("Final form values after adding item:", form.getValues());
      console.log("Updated totals:", totals);
    }, 10);
  };
  
  // Load inventory items when needed
  useEffect(() => {
    if (showInventorySearch) {
      fetchInventory(inventorySearchQuery);
    }
  }, [showInventorySearch, inventorySearchQuery, fetchInventory]);

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
      const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity * (1 - item.discount / 100)), 0);
      const taxRate = 0.16; // 16% IVA
      const taxes = subtotal * taxRate;
      const total = subtotal + taxes;
      
      // Create the quotation object
      const quotationData = {
        id_cliente: data.clientId || null,
        project_name: data.projectName,
        project_type: data.projectType,
        cotizacion_fecha: data.cotizacionDate.toISOString(),
        subtotal,
        tax_rate: taxRate,
        taxes,
        total,
        delivery_time: data.deliveryTime,
        payment_terms: data.paymentTerms,
        notes: data.notes || null
      };
      
      // For demo purposes, just log the data
      console.log("Would save quotation data:", quotationData);
      console.log("Would save items:", data.items);
      
      // Simulate API call delay 
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert("Cotización creada con éxito (simulado)");
      
      // Navigate back to quotations list
      router.push("/cotizaciones");
    } catch (error) {
      console.error("Error creating quotation:", error);
      alert("Error al crear la cotización: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
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
    if (correderasSearch) {
      setFilteredCorrederas(
        correderasMaterials.filter(m => 
          m.nombre.toLowerCase().includes(correderasSearch.toLowerCase())
        )
      );
    } else {
      setFilteredCorrederas(correderasMaterials);
    }
  }, [correderasSearch, correderasMaterials]);
  
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
                
                <TabsContent value="client" className="space-y-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Información del Cliente</h3>
                  
                  <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-1.5">
                        <Label className="text-sm font-medium text-gray-700">Seleccionar Cliente</Label>
                        <Button 
                          type="button" 
                          onClick={() => setShowClientModal(true)} 
                          variant="outline" 
                          size="sm"
                          className="bg-white hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4 mr-2 text-gray-600" /> Agregar Cliente
                        </Button>
                      </div>
                      <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openClientCombobox}
                            className="w-full md:w-[calc(50%-12px)] justify-between mt-1.5 font-normal text-gray-700 border border-input"
                          >
                            {form.watch('clientName') || "Seleccionar cliente..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar cliente..." />
                            <div className="max-h-[300px] overflow-y-auto">
                              {isLoadingClients ? (
                                <div className="py-6 text-center">
                                  <Loader2 className="h-5 w-5 mx-auto animate-spin text-gray-400" />
                                  <p className="text-sm text-gray-500 mt-2">Cargando clientes...</p>
                                </div>
                              ) : clients.length === 0 ? (
                                <CommandEmpty>No se encontraron clientes</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {clients.map(client => (
                                    <CommandItem
                                      key={client.id}
                                      value={client.id.toString()}
                                      onSelect={handleClientSelect}
                                      className="w-full cursor-pointer"
                                    >
                                      <div className="flex flex-col w-full">
                                        <span className="font-medium">{client.name}</span>
                                        {client.email && (
                                          <span className="text-xs text-muted-foreground">{client.email}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <FormField
                          control={form.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">Nombre</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nombre del cliente" 
                                  className="mt-1"
                                  {...field} 
                                />
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
                              <FormLabel className="text-sm font-medium text-gray-700">Correo electrónico</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="correo@ejemplo.com" 
                                  className="mt-1"
                                  {...field} 
                                />
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
                              <FormLabel className="text-sm font-medium text-gray-700">Teléfono</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="(123) 456-7890" 
                                  className="mt-1"
                                  {...field} 
                                />
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
                              <FormLabel className="text-sm font-medium text-gray-700">Dirección</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Dirección del cliente" 
                                  className="mt-1"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="project" className="space-y-4 mt-4">
                  <h3 className="text-lg font-medium">Detalles del Proyecto</h3>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Proyecto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Remodelación Cocina" {...field} />
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
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIPOS_PROYECTO.map((tipo) => (
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cotizacionDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
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
                  </div>
                  
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
                        <p>Los materiales seleccionados afectan directamente al cálculo de precios de los productos. Use el buscador para encontrar rápidamente materiales específicos.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="matHuacal"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Material Huacal</FormLabel>
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
                                        : "Ninguno"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar material..." 
                                      className="h-9"
                                      value={matHuacalSearch}
                                      onValueChange={setMatHuacalSearch}
                                    />
                                    {matHuacalSearch.length > 0 && filteredTabletos.length === 0 && (
                                      <CommandEmpty>No se encontraron materiales para "{matHuacalSearch}"</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue("matHuacal", "none");
                                          setOpenMatHuacalCombobox(false);
                                        }}
                                      >
                                        <span>Ninguno</span>
                                      </CommandItem>
                                      {filteredTabletos.map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={material.id_material.toString()}
                                          onSelect={() => {
                                            form.setValue("matHuacal", material.id_material.toString());
                                            setOpenMatHuacalCombobox(false);
                                          }}
                                        >
                                          <HighlightedText 
                                            text={`${material.nombre} - $${material.costo}`} 
                                            query={matHuacalSearch} 
                                          />
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
                        
                        <FormField
                          control={form.control}
                          name="matVista"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Material Vista</FormLabel>
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
                                        : "Ninguno"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar material..." 
                                      className="h-9"
                                      value={matVistaSearch}
                                      onValueChange={setMatVistaSearch}
                                    />
                                    {matVistaSearch.length > 0 && filteredTabletos.length === 0 && (
                                      <CommandEmpty>No se encontraron materiales para "{matVistaSearch}"</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue("matVista", "none");
                                          setOpenMatVistaCombobox(false);
                                        }}
                                      >
                                        <span>Ninguno</span>
                                      </CommandItem>
                                      {filteredTabletos.map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={material.id_material.toString()}
                                          onSelect={() => {
                                            form.setValue("matVista", material.id_material.toString());
                                            setOpenMatVistaCombobox(false);
                                          }}
                                        >
                                          <HighlightedText 
                                            text={`${material.nombre} - $${material.costo}`} 
                                            query={matVistaSearch} 
                                          />
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <FormField
                          control={form.control}
                          name="chapHuacal"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Chapacinta Huacal</FormLabel>
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
                                        ? chapacintaMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Ninguno"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar chapacinta..."
                                      className="h-9"
                                      value={chapHuacalSearch}
                                      onValueChange={setChapHuacalSearch}
                                    />
                                    {chapHuacalSearch.length > 0 && filteredChapacinta.length === 0 && (
                                      <CommandEmpty>No se encontraron chapacinta para "{chapHuacalSearch}"</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue("chapHuacal", "none");
                                          setOpenChapHuacalCombobox(false);
                                        }}
                                      >
                                        <span>Ninguno</span>
                                      </CommandItem>
                                      {filteredChapacinta.map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={material.id_material.toString()}
                                          onSelect={() => {
                                            form.setValue("chapHuacal", material.id_material.toString());
                                            setOpenChapHuacalCombobox(false);
                                          }}
                                        >
                                          <HighlightedText 
                                            text={`${material.nombre} - $${material.costo}`} 
                                            query={chapHuacalSearch} 
                                          />
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
                        
                        <FormField
                          control={form.control}
                          name="chapVista"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Chapacinta Vista</FormLabel>
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
                                        ? chapacintaMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Ninguno"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar chapacinta..." 
                                      className="h-9"
                                      value={chapVistaSearch}
                                      onValueChange={setChapVistaSearch}
                                    />
                                    {chapVistaSearch.length > 0 && filteredChapacinta.length === 0 && (
                                      <CommandEmpty>No se encontraron chapacinta para "{chapVistaSearch}"</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue("chapVista", "none");
                                          setOpenChapVistaCombobox(false);
                                        }}
                                      >
                                        <span>Ninguno</span>
                                      </CommandItem>
                                      {filteredChapacinta.map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={material.id_material.toString()}
                                          onSelect={() => {
                                            form.setValue("chapVista", material.id_material.toString());
                                            setOpenChapVistaCombobox(false);
                                          }}
                                        >
                                          <HighlightedText 
                                            text={`${material.nombre} - $${material.costo}`} 
                                            query={chapVistaSearch} 
                                          />
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <FormField
                          control={form.control}
                          name="jaladera"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Jaladera</FormLabel>
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
                                        : "Ninguno"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar jaladera..." 
                                      className="h-9"
                                      value={jaladeraSearch}
                                      onValueChange={setJaladeraSearch}
                                    />
                                    {jaladeraSearch.length > 0 && filteredJaladera.length === 0 && (
                                      <CommandEmpty>No se encontraron jaladeras para "{jaladeraSearch}"</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue("jaladera", "none");
                                          setOpenJaladeraCombobox(false);
                                        }}
                                      >
                                        <span>Ninguno</span>
                                      </CommandItem>
                                      {filteredJaladera.map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={material.id_material.toString()}
                                          onSelect={() => {
                                            form.setValue("jaladera", material.id_material.toString());
                                            setOpenJaladeraCombobox(false);
                                          }}
                                        >
                                          <HighlightedText 
                                            text={`${material.nombre} - $${material.costo}`} 
                                            query={jaladeraSearch} 
                                          />
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
                        
                        <FormField
                          control={form.control}
                          name="corredera"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Correderas</FormLabel>
                              <Popover open={openCorrederasCombobox} onOpenChange={setOpenCorrederasCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openCorrederasCombobox}
                                      className="w-full justify-between"
                                    >
                                      {field.value && field.value !== "none"
                                        ? correderasMaterials.find(
                                            (material) => material.id_material.toString() === field.value
                                          )?.nombre || "Ninguno"
                                        : "Ninguno"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar correderas..." 
                                      className="h-9"
                                      value={correderasSearch}
                                      onValueChange={setCorrederasSearch}
                                    />
                                    {correderasSearch.length > 0 && filteredCorrederas.length === 0 && (
                                      <CommandEmpty>No se encontraron correderas para "{correderasSearch}"</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue("corredera", "none");
                                          setOpenCorrederasCombobox(false);
                                        }}
                                      >
                                        <span>Ninguno</span>
                                      </CommandItem>
                                      {filteredCorrederas.map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={material.id_material.toString()}
                                          onSelect={() => {
                                            form.setValue("corredera", material.id_material.toString());
                                            setOpenCorrederasCombobox(false);
                                          }}
                                        >
                                          <HighlightedText 
                                            text={`${material.nombre} - $${material.costo}`} 
                                            query={correderasSearch} 
                                          />
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
                        
                        <FormField
                          control={form.control}
                          name="bisagras"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Bisagras</FormLabel>
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
                                        : "Ninguno"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar bisagras..." 
                                      className="h-9"
                                      value={bisagrasSearch}
                                      onValueChange={setBisagrasSearch}
                                    />
                                    {bisagrasSearch.length > 0 && filteredBisagras.length === 0 && (
                                      <CommandEmpty>No se encontraron bisagras para "{bisagrasSearch}"</CommandEmpty>
                                    )}
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue("bisagras", "none");
                                          setOpenBisagrasCombobox(false);
                                        }}
                                      >
                                        <span>Ninguno</span>
                                      </CommandItem>
                                      {filteredBisagras.map((material) => (
                                        <CommandItem
                                          key={material.id_material}
                                          value={material.id_material.toString()}
                                          onSelect={() => {
                                            form.setValue("bisagras", material.id_material.toString());
                                            setOpenBisagrasCombobox(false);
                                          }}
                                        >
                                          <HighlightedText 
                                            text={`${material.nombre} - $${material.costo}`} 
                                            query={bisagrasSearch} 
                                          />
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
                      
                      <div className="mt-6 border border-gray-200 rounded-md p-4">
                        <h4 className="font-medium mb-2">Materiales Seleccionados</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Material Huacal:</span>{" "}
                            {form.watch("matHuacal") && form.watch("matHuacal") !== "none" 
                              ? tabletosMaterials.find(m => m.id_material.toString() === form.watch("matHuacal"))?.nombre 
                              : "Ninguno"}
                          </div>
                          <div>
                            <span className="font-medium">Material Vista:</span>{" "}
                            {form.watch("matVista") && form.watch("matVista") !== "none" 
                              ? tabletosMaterials.find(m => m.id_material.toString() === form.watch("matVista"))?.nombre 
                              : "Ninguno"}
                          </div>
                          <div>
                            <span className="font-medium">Chapacinta Huacal:</span>{" "}
                            {form.watch("chapHuacal") && form.watch("chapHuacal") !== "none" 
                              ? chapacintaMaterials.find(m => m.id_material.toString() === form.watch("chapHuacal"))?.nombre 
                              : "Ninguno"}
                          </div>
                          <div>
                            <span className="font-medium">Chapacinta Vista:</span>{" "}
                            {form.watch("chapVista") && form.watch("chapVista") !== "none" 
                              ? chapacintaMaterials.find(m => m.id_material.toString() === form.watch("chapVista"))?.nombre 
                              : "Ninguno"}
                          </div>
                          <div>
                            <span className="font-medium">Jaladera:</span>{" "}
                            {form.watch("jaladera") && form.watch("jaladera") !== "none" 
                              ? jaladeraMaterials.find(m => m.id_material.toString() === form.watch("jaladera"))?.nombre 
                              : "Ninguno"}
                          </div>
                          <div>
                            <span className="font-medium">Correderas:</span>{" "}
                            {form.watch("corredera") && form.watch("corredera") !== "none" 
                              ? correderasMaterials.find(m => m.id_material.toString() === form.watch("corredera"))?.nombre 
                              : "Ninguno"}
                          </div>
                          <div>
                            <span className="font-medium">Bisagras:</span>{" "}
                            {form.watch("bisagras") && form.watch("bisagras") !== "none" 
                              ? bisagrasMaterials.find(m => m.id_material.toString() === form.watch("bisagras"))?.nombre 
                              : "Ninguno"}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="items" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Productos/Artículos</h3>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        onClick={() => {
                          // Recalculate prices for all items based on current material selections
                          const items = form.getValues('items');
                          items.forEach((item, index) => {
                            if (item.furnitureData) {
                              // Re-add the item to trigger price calculation
                              const tempItem = {
                                ...item,
                                mueble_id: item.furnitureData.mueble_id,
                                nombre_mueble: item.description
                              };
                              addInventoryItem(tempItem);
                            }
                          });
                        }}
                        variant="outline" 
                        size="sm"
                      >
                        <Calculator className="h-4 w-4 mr-2" /> Recalcular Precios
                      </Button>
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
                            <TableHead className="w-[50%]">Descripción</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio Unitario</TableHead>
                            <TableHead className="text-right">Descuento (%)</TableHead>
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
                  
                  <div className="flex flex-col items-end mt-4 space-y-2">
                    <div className="flex justify-between w-48">
                      <span className="text-sm">Subtotal:</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between w-48">
                      <span className="text-sm">IVA (16%):</span>
                      <span>{formatCurrency(totals.tax)}</span>
                    </div>
                    <div className="flex justify-between w-48 font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notas adicionales o comentarios" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Debugging section to show formula details */}
                  <div className="mt-8 border border-gray-200 rounded-md p-4 text-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-700">Detalles de Cálculo de Precios (Debugging)</h4>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('formula-details')?.classList.toggle('hidden')}
                      >
                        Mostrar/Ocultar
                      </Button>
                    </div>
                    
                    <div id="formula-details" className="mt-2 space-y-4 hidden">
                      {fields.map((field, index) => {
                        const item = form.getValues(`items.${index}`);
                        const fd = item?.furnitureData;
                        if (!fd) return <div key={field.id}>No hay datos para este elemento</div>;
                        
                        // Get selected materials
                        const matHuacalId = form.getValues('matHuacal');
                        const matVistaId = form.getValues('matVista');
                        const chapHuacalId = form.getValues('chapHuacal');
                        const chapVistaId = form.getValues('chapVista');
                        const jaladeraId = form.getValues('jaladera');
                        const correderaId = form.getValues('corredera');
                        const bisagrasId = form.getValues('bisagras');
                        
                        // Get material objects
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
                          
                        // Default costs for fixed materials
                        const DEFAULT_PATAS_COST = 10;
                        const DEFAULT_CLIP_PATAS_COST = 2;
                        const DEFAULT_MENSULAS_COST = 0.9;
                        const DEFAULT_KIT_TORNILLO_COST = 30;
                        const DEFAULT_CIF_COST = 100;
                        
                        // Calculate multiplier
                        const projectType = form.getValues('projectType');
                        let multiplier = 1;
                        if (projectType === "Residencial") {
                          multiplier = 1.8;
                        } else if (projectType === "Desarrollo") {
                          multiplier = 1.5;
                        }
                        
                        return (
                          <div key={field.id} className="border-t pt-4">
                            <h5 className="font-semibold mb-2">{item.description} (Item {index + 1})</h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                              <div className="col-span-2 mb-1">
                                <div className="font-medium">Multiplicador por tipo de proyecto: {multiplier}x ({projectType})</div>
                              </div>
                              
                              {fd.mat_huacal && matHuacalMaterial && (
                                <div>
                                  <div className="font-medium">Material Huacal:</div>
                                  <div>{fd.mat_huacal} × ${matHuacalMaterial.costo} × {multiplier} = ${(fd.mat_huacal * matHuacalMaterial.costo * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.mat_vista && matVistaMaterial && (
                                <div>
                                  <div className="font-medium">Material Vista:</div>
                                  <div>{fd.mat_vista} × ${matVistaMaterial.costo} × {multiplier} = ${(fd.mat_vista * matVistaMaterial.costo * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.chap_huacal && chapHuacalMaterial && (
                                <div>
                                  <div className="font-medium">Chapacinta Huacal:</div>
                                  <div>{fd.chap_huacal} × ${chapHuacalMaterial.costo} × {multiplier} = ${(fd.chap_huacal * chapHuacalMaterial.costo * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.chap_vista && chapVistaMaterial && (
                                <div>
                                  <div className="font-medium">Chapacinta Vista:</div>
                                  <div>{fd.chap_vista} × ${chapVistaMaterial.costo} × {multiplier} = ${(fd.chap_vista * chapVistaMaterial.costo * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.jaladera && jaladeraMaterial && (
                                <div>
                                  <div className="font-medium">Jaladera:</div>
                                  <div>{fd.jaladera} × ${jaladeraMaterial.costo} × {multiplier} = ${(fd.jaladera * jaladeraMaterial.costo * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.corredera && correderaMaterial && (
                                <div>
                                  <div className="font-medium">Corredera:</div>
                                  <div>{fd.corredera} × ${correderaMaterial.costo} × {multiplier} = ${(fd.corredera * correderaMaterial.costo * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.bisagras && bisagrasMaterial && (
                                <div>
                                  <div className="font-medium">Bisagras:</div>
                                  <div>{fd.bisagras} × ${bisagrasMaterial.costo} × {multiplier} = ${(fd.bisagras * bisagrasMaterial.costo * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.patas && fd.patas > 0 && (
                                <div>
                                  <div className="font-medium">Patas:</div>
                                  <div>{fd.patas} × ${DEFAULT_PATAS_COST} × {multiplier} = ${(fd.patas * DEFAULT_PATAS_COST * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.clip_patas && fd.clip_patas > 0 && (
                                <div>
                                  <div className="font-medium">Clip Patas:</div>
                                  <div>{fd.clip_patas} × ${DEFAULT_CLIP_PATAS_COST} × {multiplier} = ${(fd.clip_patas * DEFAULT_CLIP_PATAS_COST * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.mensulas && fd.mensulas > 0 && (
                                <div>
                                  <div className="font-medium">Ménsulas:</div>
                                  <div>{fd.mensulas} × ${DEFAULT_MENSULAS_COST} × {multiplier} = ${(fd.mensulas * DEFAULT_MENSULAS_COST * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.kit_tornillo && fd.kit_tornillo > 0 && (
                                <div>
                                  <div className="font-medium">Kit Tornillo:</div>
                                  <div>{fd.kit_tornillo} × ${DEFAULT_KIT_TORNILLO_COST} × {multiplier} = ${(fd.kit_tornillo * DEFAULT_KIT_TORNILLO_COST * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              {fd.cif && fd.cif > 0 && (
                                <div>
                                  <div className="font-medium">CIF:</div>
                                  <div>{fd.cif} × ${DEFAULT_CIF_COST} × {multiplier} = ${(fd.cif * DEFAULT_CIF_COST * multiplier).toFixed(2)}</div>
                                </div>
                              )}
                              
                              <div className="col-span-2 mt-2 font-semibold">
                                <div>Precio Total: ${item.unitPrice.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/cotizaciones">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Cotización"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Inventory Search Dialog */}
      <Dialog open={showInventorySearch} onOpenChange={setShowInventorySearch}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Buscar mueble..."
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={() => fetchInventory(inventorySearchQuery)}
                variant="outline"
                size="icon"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoadingInventory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron muebles. Intente con otra búsqueda.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.mueble_id}>
                        <TableCell>{item.nombre_mueble}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addInventoryItem(item)}
                          >
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <div className="pt-4 text-sm text-muted-foreground">
              Seleccione un producto del inventario para agregarlo automáticamente a la cotización.
              El precio se calculará automáticamente según los materiales seleccionados.
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