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
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';

interface Material {
  id_material: number;
  tipo: string;
  nombre: string;
  costo: number;
  categoria: string;
  subcategoria?: string;
  comentario?: string;
}

const TIPOS_MATERIAL = ['Tableros', 'Cubrecantos', 'Jaladeras', 'Correderas', 'Bisagras'];

export default function MaterialesManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { toast } = useToast();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('tipo')
        .order('nombre');
        
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  const filterMaterials = useCallback(() => {
    let filtered = materials;
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.tipo === typeFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.categoria?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subcategoria?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredMaterials(filtered);
    setCurrentPage(1);
  }, [materials, typeFilter, searchQuery]);

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
      
      fetchMaterials();
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
      const { error } = await supabase
        .from('materiales')
        .delete()
        .eq('id_material', id);
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Material eliminado correctamente"
      });
      
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el material",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    filterMaterials();
  }, [filterMaterials]);

  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

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
              value={formData.costo}
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando materiales...</span>
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
              placeholder="Buscar por nombre, categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="type-filter">Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
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
            <Button onClick={() => setEditingMaterial(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Editar Material' : 'Nuevo Material'}
              </DialogTitle>
            </DialogHeader>
            <MaterialForm material={editingMaterial} onSave={saveMaterial} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Mostrando {paginatedMaterials.length} de {filteredMaterials.length} materiales
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
              <TableHead>Tipo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Subcategoría</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMaterials.map((material) => (
              <TableRow key={material.id_material}>
                <TableCell>
                  <Badge variant="outline">{material.tipo}</Badge>
                </TableCell>
                <TableCell className="font-medium">{material.nombre}</TableCell>
                <TableCell>${material.costo}</TableCell>
                <TableCell>{material.categoria || '-'}</TableCell>
                <TableCell>{material.subcategoria || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingMaterial(material);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMaterial(material.id_material)}
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