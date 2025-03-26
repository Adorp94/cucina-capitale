'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, CalendarIcon, Plus, Trash2, Loader2, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
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
  correderas: z.string().optional(),
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
        correderas: z.number().nullable().optional(),
        bisagras: z.number().nullable().optional(),
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
    subtotal: new Decimal(0),
    taxes: new Decimal(0.16),  // 16% IVA
    total: new Decimal(0)
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
      correderas: "none",
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
  
  // Calculate totals when items change
  const calculateTotals = () => {
    const items = form.getValues("items") || [];
    
    // Calculate subtotal
    const subtotal = items.reduce((total, item) => {
      const itemPrice = new Decimal(item.quantity || 0).mul(new Decimal(item.unitPrice || 0));
      const discount = itemPrice.mul(new Decimal(item.discount || 0).div(100));
      return total.plus(itemPrice.minus(discount));
    }, new Decimal(0));
    
    // Calculate taxes
    const taxes = subtotal.mul(new Decimal(0.16));
    
    // Calculate total
    const total = subtotal.plus(taxes);
    
    setTotals({
      subtotal,
      taxes: new Decimal(0.16),
      total
    });
  };

  // Watch for changes to items to update totals
  form.watch((value, { name }) => {
    if (name?.startsWith('items')) {
      calculateTotals();
    }
  });

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
    // Create furniture data object
    const furnitureData = {
      mueble_id: item.mueble_id,
      mat_huacal: item.mat_huacal || null,
      mat_vista: item.mat_vista || null,
      chap_huacal: item.chap_huacal || null,
      chap_vista: item.chap_vista || null,
      jaladera: item.jaladera || null,
      correderas: item.correderas || null,
      bisagras: item.bisagras || null,
    };
    
    // Calculate price based on materials
    let price = 0;
    const matHuacalId = form.getValues('matHuacal');
    const matVistaId = form.getValues('matVista');
    const chapHuacalId = form.getValues('chapHuacal');
    const chapVistaId = form.getValues('chapVista');
    const jaladeraId = form.getValues('jaladera');
    const correderasId = form.getValues('correderas');
    const bisagrasId = form.getValues('bisagras');
    
    // Get material costs
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
    const correderasMaterial = correderasId && correderasId !== "none" ? 
      correderasMaterials.find(m => m.id_material.toString() === correderasId) : null;
    const bisagrasMaterial = bisagrasId && bisagrasId !== "none" ? 
      bisagrasMaterials.find(m => m.id_material.toString() === bisagrasId) : null;
    
    // Calculate price components
    if (furnitureData.mat_huacal && matHuacalMaterial) {
      price += furnitureData.mat_huacal * matHuacalMaterial.costo;
    }
    if (furnitureData.mat_vista && matVistaMaterial) {
      price += furnitureData.mat_vista * matVistaMaterial.costo;
    }
    if (furnitureData.chap_huacal && chapHuacalMaterial) {
      price += furnitureData.chap_huacal * chapHuacalMaterial.costo;
    }
    if (furnitureData.chap_vista && chapVistaMaterial) {
      price += furnitureData.chap_vista * chapVistaMaterial.costo;
    }
    if (furnitureData.jaladera && jaladeraMaterial) {
      price += furnitureData.jaladera * jaladeraMaterial.costo;
    }
    if (furnitureData.correderas && correderasMaterial) {
      price += furnitureData.correderas * correderasMaterial.costo;
    }
    if (furnitureData.bisagras && bisagrasMaterial) {
      price += furnitureData.bisagras * bisagrasMaterial.costo;
    }
    
    // Apply multiplier based on project type
    const projectType = form.getValues('projectType');
    let multiplier = 1;
    if (projectType === "Residencial") {
      multiplier = 1.8; // 180%
    } else if (projectType === "Desarrollo") {
      multiplier = 1.5; // 150%
    }
    price *= multiplier;
    
    // Round to 2 decimal places
    price = Math.round(price * 100) / 100;
    
    // Add new item to the form
    append({
      description: item.nombre_mueble,
      quantity: 1,
      unitPrice: price,
      discount: 0,
      furnitureData,
    });
    
    // Close inventory search
    setShowInventorySearch(false);
    setSelectedInventoryItem(null);
    setInventorySearchQuery("");
    
    // Switch to items tab
    setCurrentTab("items");
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
                  <h3 className="text-lg font-medium">Información del Cliente</h3>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="client-select">Seleccionar Cliente</Label>
                      <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openClientCombobox}
                            className="w-full justify-between"
                          >
                            {form.watch('clientName') || "Seleccionar cliente..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar cliente..." className="h-9" />
                            <CommandEmpty>
                              {isLoadingClients ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Cargando clientes...</span>
                                </div>
                              ) : (
                                "No se encontraron clientes"
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.id.toString()}
                                  onSelect={handleClientSelect}
                                >
                                  <span>{client.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Cliente</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@ejemplo.com" {...field} />
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
                            <Input placeholder="Teléfono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección del cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          name="correderas"
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
                                          form.setValue("correderas", "none");
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
                                            form.setValue("correderas", material.id_material.toString());
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
                            {form.watch("correderas") && form.watch("correderas") !== "none" 
                              ? correderasMaterials.find(m => m.id_material.toString() === form.watch("correderas"))?.nombre 
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
                        onClick={() => setShowInventorySearch(true)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Search className="h-4 w-4 mr-2" /> Buscar en Inventario
                      </Button>
                      <Button 
                        type="button" 
                        onClick={addNewItem} 
                        variant="outline" 
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Manual
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
                          onClick={addNewItem} 
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
                                      onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unitPrice`}
                                  render={({ field }) => (
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      className="w-28 text-right ml-auto"
                                      min={0}
                                      step={0.01}
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
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
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {(() => {
                                  const item = form.getValues(`items.${index}`);
                                  if (!item) return "—";
                                  const quantity = item.quantity || 0;
                                  const price = item.unitPrice || 0;
                                  const discount = item.discount || 0;
                                  const total = quantity * price * (1 - discount / 100);
                                  return formatCurrency(total);
                                })()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => remove(index)}
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
                      <span>{formatCurrency(totals.subtotal.toNumber())}</span>
                    </div>
                    <div className="flex justify-between w-48">
                      <span className="text-sm">IVA (16%):</span>
                      <span>{formatCurrency(totals.subtotal.mul(totals.taxes).toNumber())}</span>
                    </div>
                    <div className="flex justify-between w-48 font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.subtotal.mul(new Decimal(1).plus(totals.taxes)).toNumber())}</span>
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
            <DialogTitle>Buscar en Inventario</DialogTitle>
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
    </>
  );
} 