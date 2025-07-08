'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Material {
  id_material: number;
  tipo: string;
  nombre: string;
  costo: number;
  categoria: string;
  subcategoria?: string;
  comentario?: string;
}

interface SearchResult {
  data: Material[];
  count: number;
  totalPages: number;
}

const TIPOS_MATERIAL = ['Tableros', 'Cubrecantos', 'Jaladeras', 'Correderas', 'Bisagras'];
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

export default function MaterialesManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
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
  const fetchMaterials = useCallback(async (
    page: number = 1,
    search: string = '',
    type: string = 'all'
  ): Promise<SearchResult> => {
    console.log('🔍 Fetching materials:', { page, search, type });
    setLoading(true);
    
    try {
      let query = supabase
        .from('materiales')
        .select('*', { count: 'exact' });

      // Apply type filter
      if (type !== 'all') {
        query = query.eq('tipo', type);
      }

      // Apply search filter - search across multiple fields
      if (search.trim()) {
        query = query.or(
          `nombre.ilike.%${search}%,categoria.ilike.%${search}%,subcategoria.ilike.%${search}%,comentario.ilike.%${search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .order('nombre')
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
      
      console.log('✅ Materials fetched:', {
        records: data?.length || 0,
        total: count,
        page,
        totalPages
      });

      return {
        data: data || [],
        count: count || 0,
        totalPages
      };
      
    } catch (error) {
      console.error('💥 Error fetching materials:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales",
        variant: "destructive"
      });
      return { data: [], count: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  // Load data when filters change
  useEffect(() => {
    const loadData = async () => {
      const result = await fetchMaterials(currentPage, debouncedSearchQuery, typeFilter);
      setMaterials(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
    };

    loadData();
  }, [fetchMaterials, currentPage, debouncedSearchQuery, typeFilter]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, typeFilter]);

  const saveMaterial = async (materialData: Omit<Material, 'id_material'> & { id_material?: number }) => {
    try {
      if (materialData.id_material) {
        // Update existing
        const { error } = await supabase
          .from('materiales')
          .update(materialData)
          .eq('id_material', materialData.id_material);
          
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Material actualizado correctamente"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('materiales')
          .insert([materialData]);
          
        if (error) throw error;
        
        toast({
          title: "Éxito", 
          description: "Material creado correctamente"
        });
      }
      
      // Refresh current page
      const result = await fetchMaterials(currentPage, debouncedSearchQuery, typeFilter);
      setMaterials(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
      
      setIsDialogOpen(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error saving material:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el material",
        variant: "destructive"
      });
    }
  };

  const deleteMaterial = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este material?')) return;
    
    try {
      const { data, error, count } = await supabase
        .from('materiales')
        .delete()
        .eq('id_material', id)
        .select('id_material');
        
      if (error) throw error;
      
      // Verify the delete actually happened
      if (!data || data.length === 0) {
        throw new Error('No se pudo eliminar el material. Verifique los permisos.');
      }
      
      toast({
        title: "Éxito",
        description: "Material eliminado correctamente"
      });
      
      // Refresh current page
      const result = await fetchMaterials(currentPage, debouncedSearchQuery, typeFilter);
      setMaterials(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
      
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el material",
        variant: "destructive"
      });
    }
  };

  const MaterialForm = ({ material, onSave }: { 
    material?: Material | null; 
    onSave: (data: any) => void; 
  }) => {
    const [formData, setFormData] = useState({
      tipo: material?.tipo || '',
      nombre: material?.nombre || '',
      costo: material?.costo || 0,
      categoria: material?.categoria || '',
      subcategoria: material?.subcategoria || '',
      comentario: material?.comentario || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        ...(material?.id_material && { id_material: material.id_material })
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_MATERIAL.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="costo">Costo *</Label>
            <Input 
              type="number" 
              step="0.01"
              placeholder="0.00"
              value={formData.costo === 0 ? '' : formData.costo}
              onChange={(e) => setFormData({...formData, costo: parseFloat(e.target.value) || 0})}
              required 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input 
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            required 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="categoria">Categoría</Label>
            <Input 
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="subcategoria">Subcategoría</Label>
            <Input 
              value={formData.subcategoria}
              onChange={(e) => setFormData({...formData, subcategoria: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="comentario">Comentario</Label>
          <Input 
            value={formData.comentario}
            onChange={(e) => setFormData({...formData, comentario: e.target.value})}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            {material ? 'Actualizar' : 'Crear'} Material
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
              placeholder="Buscar materiales..."
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 h-8 border-gray-200">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {TIPOS_MATERIAL.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingMaterial(null)}
              className="h-8 px-3 bg-gray-900 hover:bg-gray-800 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">
                {editingMaterial ? 'Editar Material' : 'Nuevo Material'}
              </DialogTitle>
            </DialogHeader>
            <MaterialForm material={editingMaterial} onSave={saveMaterial} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Results Info & Pagination */}
      <div className="flex justify-between items-center py-1">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{materials.length}</span> de <span className="font-medium">{totalCount}</span> materiales
          {searchQuery && <span> • Búsqueda: "{searchQuery}"</span>}
          {typeFilter !== 'all' && <span> • Tipo: {typeFilter}</span>}
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
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Tipo</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Nombre</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Costo</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Categoría</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Subcategoría</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5 w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="text-gray-500">Cargando materiales...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-gray-500">
                    {searchQuery || typeFilter !== 'all' 
                      ? 'No se encontraron materiales con los filtros aplicados' 
                      : 'No hay materiales registrados'
                    }
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id_material} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">
                      {material.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="font-medium text-gray-900">{material.nombre}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-gray-900">${material.costo?.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-gray-600">{material.categoria || '—'}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-gray-600">{material.subcategoria || '—'}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingMaterial(material);
                          setIsDialogOpen(true);
                        }}
                        className="h-7 w-7 p-0 hover:bg-gray-100"
                      >
                        <Edit className="h-3.5 w-3.5 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMaterial(material.id_material)}
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