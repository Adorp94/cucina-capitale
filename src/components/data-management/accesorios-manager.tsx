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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';

interface Accesorio {
  id_accesorios: number;
  accesorios: string;
  costo: number;
  categoria: string;
  comentario?: string;
}

interface SearchResult {
  data: Accesorio[];
  count: number;
  totalPages: number;
}

// Debounce hook
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

const ITEMS_PER_PAGE = 50;

// Categories available for accesorios
const CATEGORIAS_ACCESORIO = [
  'Herraje',
  'Lambrín', 
  'Mano de obra',
  'Puerta',
  'Vidrío'
];

export default function AccesoriosManager() {
  const [accesorios, setAccesorios] = useState<Accesorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingAccesorio, setEditingAccesorio] = useState<Accesorio | null>(null);
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
  const fetchAccesorios = useCallback(async (
    page: number = 1,
    search: string = '',
    category: string = 'all'
  ): Promise<SearchResult> => {
    console.log('🔍 Fetching accesorios:', { page, search, category });
    setLoading(true);
    
    try {
      let query = supabase
        .from('accesorios')
        .select('*', { count: 'exact' });

      // Apply category filter
      if (category !== 'all') {
        query = query.eq('categoria', category);
      }

      // Apply search filter - search across multiple fields
      if (search.trim()) {
        query = query.or(
          `accesorios.ilike.%${search}%,categoria.ilike.%${search}%,comentario.ilike.%${search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .order('accesorios')
        .range(from, to);

      const { data, error, count } = await query;
        
      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
      
      console.log('✅ Accesorios fetched:', {
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
      console.error('💥 Error fetching accesorios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los accesorios",
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
      const result = await fetchAccesorios(currentPage, debouncedSearchQuery, categoryFilter);
      setAccesorios(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
    };

    loadData();
  }, [fetchAccesorios, currentPage, debouncedSearchQuery, categoryFilter]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, categoryFilter]);

  const saveAccesorio = async (accesorioData: Omit<Accesorio, 'id_accesorios'> & { id_accesorios?: number }) => {
    try {
      if (accesorioData.id_accesorios) {
        // Update existing
        const { error } = await supabase
          .from('accesorios')
          .update(accesorioData)
          .eq('id_accesorios', accesorioData.id_accesorios);
          
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Accesorio actualizado correctamente"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('accesorios')
          .insert([accesorioData]);
          
        if (error) throw error;
        
        toast({
          title: "Éxito", 
          description: "Accesorio creado correctamente"
        });
      }
      
      // Refresh current page
      const result = await fetchAccesorios(currentPage, debouncedSearchQuery, categoryFilter);
      setAccesorios(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
      
      setIsDialogOpen(false);
      setEditingAccesorio(null);
    } catch (error) {
      console.error('Error saving accesorio:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el accesorio",
        variant: "destructive"
      });
    }
  };

  const deleteAccesorio = async (accesorio: Accesorio) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${accesorio.accesorios}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('accesorios')
        .delete()
        .eq('id_accesorios', accesorio.id_accesorios);
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Accesorio eliminado correctamente"
      });
      
      // Refresh current page or go to previous page if current page becomes empty
      let targetPage = currentPage;
      if (accesorios.length === 1 && currentPage > 1) {
        targetPage = currentPage - 1;
        setCurrentPage(targetPage);
      }
      
      const result = await fetchAccesorios(targetPage, debouncedSearchQuery, categoryFilter);
      setAccesorios(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error deleting accesorio:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el accesorio",
        variant: "destructive"
      });
    }
  };

  const AccesorioForm = ({ accesorio, onSave, onCancel }: {
    accesorio: Accesorio | null;
    onSave: (data: Omit<Accesorio, 'id_accesorios'> & { id_accesorios?: number }) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      accesorios: accesorio?.accesorios || '',
      costo: accesorio?.costo || 0,
      categoria: accesorio?.categoria || '',
      comentario: accesorio?.comentario || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        ...(accesorio?.id_accesorios && { id_accesorios: accesorio.id_accesorios })
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accesorios">Nombre del Accesorio</Label>
          <Input
            id="accesorios"
            value={formData.accesorios}
            onChange={(e) => setFormData(prev => ({ ...prev, accesorios: e.target.value }))}
            placeholder="Ej: Tapete antihumedad"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Select
            value={formData.categoria}
            onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_ACCESORIO.map(categoria => (
                <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="costo">Costo</Label>
          <Input
            id="costo"
            type="number"
            step="0.01"
            min="0"
            value={formData.costo}
            onChange={(e) => setFormData(prev => ({ ...prev, costo: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comentario">Comentario (opcional)</Label>
          <Textarea
            id="comentario"
            value={formData.comentario}
            onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
            placeholder="Información adicional sobre el accesorio..."
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {accesorio ? 'Actualizar' : 'Crear'} Accesorio
          </Button>
        </div>
      </form>
    );
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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
              placeholder="Buscar accesorios..."
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
              {CATEGORIAS_ACCESORIO.map(categoria => (
                <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Add Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="h-8 bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
              onClick={() => setEditingAccesorio(null)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Accesorio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingAccesorio ? 'Editar Accesorio' : 'Nuevo Accesorio'}
              </DialogTitle>
            </DialogHeader>
            <AccesorioForm
              accesorio={editingAccesorio}
              onSave={saveAccesorio}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 px-1">
        <div className="flex items-center gap-2">
          <span>
            Mostrando {accesorios.length} de {totalCount.toLocaleString()} accesorios
          </span>
          {(searchQuery.trim() || categoryFilter !== 'all') && (
            <Badge variant="secondary" className="text-xs">
              Filtrado
            </Badge>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="text-xs">
            Página {currentPage} de {totalPages}
          </div>
        )}
      </div>

      {/* Enhanced Results Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-gray-200">
              <TableHead className="font-medium text-gray-900 py-3">ID</TableHead>
              <TableHead className="font-medium text-gray-900">Accesorio</TableHead>
              <TableHead className="font-medium text-gray-900">Categoría</TableHead>
              <TableHead className="font-medium text-gray-900">Costo</TableHead>
              <TableHead className="font-medium text-gray-900">Comentario</TableHead>
              <TableHead className="font-medium text-gray-900 w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accesorios.map((accesorio) => (
              <TableRow key={accesorio.id_accesorios} className="hover:bg-gray-50 border-gray-100">
                <TableCell className="text-sm text-gray-600 py-3">
                  {accesorio.id_accesorios}
                </TableCell>
                <TableCell className="font-medium py-3">
                  {accesorio.accesorios}
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline" className="text-xs">
                    {accesorio.categoria}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm py-3">
                  {formatCurrency(accesorio.costo)}
                </TableCell>
                <TableCell className="text-sm text-gray-600 py-3 max-w-xs truncate">
                  {accesorio.comentario || '-'}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-100"
                      onClick={() => {
                        setEditingAccesorio(accesorio);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-red-50 text-red-600 hover:text-red-700"
                      onClick={() => deleteAccesorio(accesorio)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {accesorios.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-8 w-8 text-gray-300" />
                    <p>No se encontraron accesorios</p>
                    {(searchQuery.trim() || categoryFilter !== 'all') && (
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando accesorios...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 px-3"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 px-3"
          >
            Siguiente
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
} 