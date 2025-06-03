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
import { Plus, Search, Edit, Trash2, Loader2, Package } from 'lucide-react';

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

export default function InsumosManager() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { toast } = useToast();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchInsumos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('categoria')
        .order('descripcion')
        .limit(500); // Limit for performance
        
      if (error) throw error;
      setInsumos(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(item => item.categoria).filter(Boolean))];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error fetching insumos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  const filterInsumos = useCallback(() => {
    let filtered = insumos;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.categoria === categoryFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(i => 
        i.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.mueble?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.categoria?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredInsumos(filtered);
    setCurrentPage(1);
  }, [insumos, categoryFilter, searchQuery]);

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
      
      fetchInsumos();
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
      const { error } = await supabase
        .from('insumos')
        .delete()
        .eq('insumo_id', id);
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente"
      });
      
      fetchInsumos();
    } catch (error) {
      console.error('Error deleting insumo:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, [fetchInsumos]);

  useEffect(() => {
    filterInsumos();
  }, [filterInsumos]);

  const paginatedInsumos = filteredInsumos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredInsumos.length / itemsPerPage);

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
      t_tl: insumo?.t_tl || 0
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
    }) => (
      <div>
        <Label htmlFor={field}>{label}</Label>
        <Input 
          type="number" 
          step={step}
          value={formData[field] || 0}
          onChange={(e) => setFormData({
            ...formData, 
            [field]: parseFloat(e.target.value) || 0
          })}
        />
      </div>
    );

    return (
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Información Básica</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoría *</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(value) => setFormData({...formData, categoria: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Input 
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              required 
            />
          </div>

          <div>
            <Label htmlFor="mueble">Mueble</Label>
            <Input 
              value={formData.mueble}
              onChange={(e) => setFormData({...formData, mueble: e.target.value})}
            />
          </div>
        </div>

        {/* Component Quantities */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Componentes</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <NumberInput label="Cajones" field="cajones" />
            <NumberInput label="Puertas" field="puertas" />
            <NumberInput label="Entrepaños" field="entrepaños" />
          </div>
        </div>

        {/* Materials */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Materiales (m²)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="Material Huacal" field="mat_huacal" />
            <NumberInput label="Material Vista" field="mat_vista" />
            <NumberInput label="Chapacinta Huacal" field="chap_huacal" />
            <NumberInput label="Chapacinta Vista" field="chap_vista" />
          </div>
        </div>

        {/* Hardware */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Herrajes</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <NumberInput label="Jaladera" field="jaladera" />
            <NumberInput label="Corredera" field="corredera" />
            <NumberInput label="Bisagras" field="bisagras" />
            <NumberInput label="Patas" field="patas" />
            <NumberInput label="Clip Patas" field="clip_patas" />
            <NumberInput label="Ménsulas" field="mensulas" />
          </div>
        </div>

        {/* Special Components */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Componentes Especiales</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="Tip-on Largo" field="tipon_largo" />
            <NumberInput label="Kit Tornillo" field="kit_tornillo" />
            <NumberInput label="CIF" field="cif" />
            <div>
              <Label htmlFor="empaque">Empaque</Label>
              <Input 
                value={formData.empaque}
                onChange={(e) => setFormData({...formData, empaque: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* TL Values */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Valores TL</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="U TL" field="u_tl" />
            <NumberInput label="T TL" field="t_tl" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Buscar por descripción, mueble..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="category-filter">Categoría</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingInsumo(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingInsumo ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <InsumoForm insumo={editingInsumo} onSave={saveInsumo} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Mostrando {paginatedInsumos.length} de {filteredInsumos.length} productos
        </p>
        
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="py-2 px-3 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Mueble</TableHead>
              <TableHead>Mat. Huacal</TableHead>
              <TableHead>Mat. Vista</TableHead>
              <TableHead>Herrajes</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInsumos.map((insumo) => (
              <TableRow key={insumo.insumo_id}>
                <TableCell>
                  <Badge variant="outline">{insumo.categoria}</Badge>
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  {insumo.descripcion}
                </TableCell>
                <TableCell className="max-w-xs truncate">{insumo.mueble || '-'}</TableCell>
                <TableCell>{insumo.mat_huacal || 0}</TableCell>
                <TableCell>{insumo.mat_vista || 0}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {insumo.jaladera ? <div>J: {insumo.jaladera}</div> : null}
                    {insumo.corredera ? <div>C: {insumo.corredera}</div> : null}
                    {insumo.bisagras ? <div>B: {insumo.bisagras}</div> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingInsumo(insumo);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteInsumo(insumo.insumo_id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 