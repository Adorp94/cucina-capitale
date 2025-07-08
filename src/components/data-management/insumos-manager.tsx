'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface Insumo {
  insumo_id: number;
  categoria: string;
  descripcion: string;
  mueble: string;
  cajones?: number;
  puertas?: number;
  entrepaños?: number;
  mat_huacal?: number;
  mat_vista?: number;
  chap_huacal?: number;
  chap_vista?: number;
  jaladera?: number;
  corredera?: number;
  bisagras?: number;
  patas?: number;
  clip_patas?: number;
  mensulas?: number;
  tipon_largo?: number;
  kit_tornillo?: number;
  empaque?: string;
  cif?: number;
  tipo_mueble?: string;
  tipo?: string;
  u_tl?: number;
  t_tl?: number;
}

interface SearchResult {
  data: Insumo[];
  count: number;
  totalPages: number;
  categories: string[];
}

const ITEMS_PER_PAGE = 25;

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function InsumosManager() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const { toast } = useToast();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Debounce search to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Server-side search and pagination
  const fetchInsumos = useCallback(async (
    page: number = 1,
    search: string = '',
    category: string = 'all'
  ): Promise<SearchResult> => {
    console.log('🔍 Fetching insumos:', { page, search, category });
    setLoading(true);
    
    try {
      let query = supabase
        .from('insumos')
        .select('*', { count: 'exact' });

      // Apply category filter
      if (category !== 'all') {
        query = query.eq('categoria', category);
      }

      // Apply search filter - search across multiple fields
      if (search.trim()) {
        query = query.or(
          `descripcion.ilike.%${search}%,mueble.ilike.%${search}%,categoria.ilike.%${search}%,tipo_mueble.ilike.%${search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .order('categoria')
        .order('descripcion')
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }

      // Fetch categories separately for filter dropdown
      let categoriesData: string[] = [];
      if (page === 1) { // Only fetch categories on first page
        const { data: catData, error: catError } = await supabase
          .from('insumos')
          .select('categoria')
          .not('categoria', 'is', null);
        
        if (!catError && catData) {
          categoriesData = [...new Set(catData.map(item => item.categoria).filter(Boolean))].sort();
        }
      }

      const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
      
      console.log('✅ Insumos fetched:', {
        records: data?.length || 0,
        total: count,
        page,
        totalPages,
        categories: categoriesData.length
      });

      return {
        data: data || [],
        count: count || 0,
        totalPages,
        categories: categoriesData
      };
      
    } catch (error) {
      console.error('💥 Error fetching insumos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
      return { data: [], count: 0, totalPages: 0, categories: [] };
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  // Load data when filters change
  useEffect(() => {
    const loadData = async () => {
      const result = await fetchInsumos(currentPage, debouncedSearchQuery, categoryFilter);
      setInsumos(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
      
      // Update categories only on first page
      if (currentPage === 1 && result.categories.length > 0) {
        setCategories(result.categories);
      }
    };

    loadData();
  }, [fetchInsumos, currentPage, debouncedSearchQuery, categoryFilter]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, categoryFilter]);

  const saveInsumo = async (insumoData: Omit<Insumo, 'insumo_id'> & { insumo_id?: number }) => {
    try {
      if (insumoData.insumo_id) {
        // Update existing
        const { error } = await supabase
          .from('insumos')
          .update(insumoData)
          .eq('insumo_id', insumoData.insumo_id);
          
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('insumos')
          .insert([insumoData]);
          
        if (error) throw error;
        
        toast({
          title: "Éxito", 
          description: "Producto creado correctamente"
        });
      }
      
      // Refresh current page
      const result = await fetchInsumos(currentPage, debouncedSearchQuery, categoryFilter);
      setInsumos(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
      
      setIsDialogOpen(false);
      setEditingInsumo(null);
    } catch (error) {
      console.error('Error saving insumo:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive"
      });
    }
  };

  const deleteInsumo = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) return;
    
    try {
      const { data, error } = await supabase
        .from('insumos')
        .delete()
        .eq('insumo_id', id)
        .select('insumo_id');
        
      if (error) throw error;
      
      // Verify the delete actually happened
      if (!data || data.length === 0) {
        throw new Error('No se pudo eliminar el producto. Verifique los permisos.');
      }
      
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente"
      });
      
      // Refresh current page
      const result = await fetchInsumos(currentPage, debouncedSearchQuery, categoryFilter);
      setInsumos(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
      
    } catch (error) {
      console.error('Error deleting insumo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el producto",
        variant: "destructive"
      });
    }
  };

  const InsumoForm = ({ insumo, onSave }: { 
    insumo?: Insumo | null; 
    onSave: (data: any) => void; 
  }) => {
    const [formData, setFormData] = useState({
      categoria: insumo?.categoria || '',
      descripcion: insumo?.descripcion || '',
      mueble: insumo?.mueble || '',
      cajones: insumo?.cajones || 0,
      puertas: insumo?.puertas || 0,
      entrepaños: insumo?.entrepaños || 0,
      mat_huacal: insumo?.mat_huacal || 0,
      mat_vista: insumo?.mat_vista || 0,
      chap_huacal: insumo?.chap_huacal || 0,
      chap_vista: insumo?.chap_vista || 0,
      jaladera: insumo?.jaladera || 0,
      corredera: insumo?.corredera || 0,
      bisagras: insumo?.bisagras || 0,
      patas: insumo?.patas || 0,
      clip_patas: insumo?.clip_patas || 0,
      mensulas: insumo?.mensulas || 0,
      tipon_largo: insumo?.tipon_largo || 0,
      kit_tornillo: insumo?.kit_tornillo || 0,
      empaque: insumo?.empaque || '',
      cif: insumo?.cif || 0,
      tipo_mueble: insumo?.tipo_mueble || '',
      tipo: insumo?.tipo || '',
      u_tl: insumo?.u_tl || 0,
      t_tl: insumo?.t_tl || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        ...(insumo?.insumo_id && { insumo_id: insumo.insumo_id })
      });
    };

    const NumberInput = ({ 
      label, 
      field, 
      step = "0.01" 
    }: { 
      label: string; 
      field: keyof typeof formData; 
      step?: string;
    }) => {
      const value = formData[field] as number;
      const placeholder = step === "1" ? "0" : "0.00";
      
      return (
        <div>
          <Label htmlFor={field}>{label}</Label>
          <Input 
            type="number" 
            step={step}
            placeholder={placeholder}
            value={value === 0 ? '' : value}
            onChange={(e) => setFormData({...formData, [field]: parseFloat(e.target.value) || 0})}
          />
        </div>
      );
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Basic Info */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900">Información Básica</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoría *</Label>
              <Input 
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                required 
              />
            </div>
            <div>
              <Label htmlFor="tipo_mueble">Tipo de Mueble</Label>
              <Input 
                value={formData.tipo_mueble}
                onChange={(e) => setFormData({...formData, tipo_mueble: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea 
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              required 
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="mueble">Mueble *</Label>
            <Input 
              value={formData.mueble}
              onChange={(e) => setFormData({...formData, mueble: e.target.value})}
              required 
            />
          </div>
        </div>

        {/* Components */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900">Componentes</h3>
          <div className="grid grid-cols-3 gap-4">
            <NumberInput label="Cajones" field="cajones" step="1" />
            <NumberInput label="Puertas" field="puertas" step="1" />
            <NumberInput label="Entrepaños" field="entrepaños" step="1" />
          </div>
        </div>

        {/* Materials */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900">Materiales</h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="Mat. Huacal" field="mat_huacal" />
            <NumberInput label="Mat. Vista" field="mat_vista" />
            <NumberInput label="Chap. Huacal" field="chap_huacal" />
            <NumberInput label="Chap. Vista" field="chap_vista" />
          </div>
        </div>

        {/* Hardware */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900">Herrajes</h3>
          <div className="grid grid-cols-3 gap-4">
            <NumberInput label="Jaladera" field="jaladera" step="1" />
            <NumberInput label="Corredera" field="corredera" step="1" />
            <NumberInput label="Bisagras" field="bisagras" step="1" />
            <NumberInput label="Patas" field="patas" step="1" />
            <NumberInput label="Clip Patas" field="clip_patas" step="1" />
            <NumberInput label="Ménsulas" field="mensulas" step="1" />
            <NumberInput label="Tipón Largo" field="tipon_largo" step="1" />
            <NumberInput label="Kit Tornillo" field="kit_tornillo" step="1" />
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900">Información Adicional</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empaque">Empaque</Label>
              <Input 
                value={formData.empaque}
                onChange={(e) => setFormData({...formData, empaque: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Input 
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              />
            </div>
            <NumberInput label="CIF" field="cif" />
            <NumberInput label="U TL" field="u_tl" />
            <NumberInput label="T TL" field="t_tl" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            {insumo ? 'Actualizar' : 'Crear'} Producto
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Search & Filter Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Enhanced Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Clean Filter Select */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 h-8 border-gray-200">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(categoria => (
                <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingInsumo(null)}
              className="h-8 px-3 bg-gray-900 hover:bg-gray-800 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">
                {editingInsumo ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <InsumoForm insumo={editingInsumo} onSave={saveInsumo} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Results Info & Pagination */}
      <div className="flex justify-between items-center py-1">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{insumos.length}</span> de <span className="font-medium">{totalCount}</span> productos
          {searchQuery && <span> • Búsqueda: "{searchQuery}"</span>}
          {categoryFilter !== 'all' && <span> • Categoría: {categoryFilter}</span>}
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Categoría</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Descripción</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Mueble</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Tipo</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Componentes</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5 w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="text-gray-500">Cargando productos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : insumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-gray-500">
                    {searchQuery || categoryFilter !== 'all' 
                      ? 'No se encontraron productos con los filtros aplicados' 
                      : 'No hay productos registrados'
                    }
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              insumos.map((insumo) => (
                <TableRow key={insumo.insumo_id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">
                      {insumo.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="font-medium text-gray-900">{insumo.descripcion}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-gray-600">{insumo.mueble}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-gray-600">{insumo.tipo_mueble || '—'}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-1 text-xs text-gray-500">
                      {insumo.cajones ? <span>C:{insumo.cajones}</span> : null}
                      {insumo.puertas ? <span>P:{insumo.puertas}</span> : null}
                      {insumo.entrepaños ? <span>E:{insumo.entrepaños}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingInsumo(insumo);
                          setIsDialogOpen(true);
                        }}
                        className="h-7 w-7 p-0 hover:bg-gray-100"
                      >
                        <Edit className="h-3.5 w-3.5 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInsumo(insumo.insumo_id)}
                        className="h-7 w-7 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 