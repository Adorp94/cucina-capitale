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
import { Plus, Search, Edit, Trash2, Loader2, Link, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface MaterialRelationship {
  id: number;
  material_id_primary: number;
  material_id_secondary: number;
  relationship_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  primary_material?: {
    nombre: string;
    tipo: string;
  };
  secondary_material?: {
    nombre: string;
    tipo: string;
  };
}

interface Material {
  id_material: number;
  nombre: string;
  tipo: string;
  costo: number;
}

export default function RelationshipsManager() {
  const [relationships, setRelationships] = useState<MaterialRelationship[]>([]);
  const [filteredRelationships, setFilteredRelationships] = useState<MaterialRelationship[]>([]);
  const [tableros, setTableros] = useState<Material[]>([]);
  const [cubrecantos, setCubrecantos] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState('all');
  const [editingRelationship, setEditingRelationship] = useState<MaterialRelationship | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const itemsPerPage = 20;
  
  const { toast } = useToast();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch relationships with material details
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('material_relationships')
        .select(`
          *,
          primary_material:materiales!material_relationships_material_id_primary_fkey(nombre, tipo),
          secondary_material:materiales!material_relationships_material_id_secondary_fkey(nombre, tipo)
        `)
        .order('created_at', { ascending: false });
        
      if (relationshipsError) throw relationshipsError;
      setRelationships(relationshipsData || []);
      
      // Fetch tableros
      const { data: tablerosData, error: tablerosError } = await supabase
        .from('materiales')
        .select('*')
        .eq('tipo', 'Tableros')
        .order('nombre');
        
      if (tablerosError) throw tablerosError;
      setTableros(tablerosData || []);
      
      // Fetch cubrecantos
      const { data: cubrecantosData, error: cubrecantosError } = await supabase
        .from('materiales')
        .select('*')
        .eq('tipo', 'Cubrecantos')
        .order('nombre');
        
      if (cubrecantosError) throw cubrecantosError;
      setCubrecantos(cubrecantosData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las relaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  const filterRelationships = useCallback(() => {
    let filtered = relationships;
    
    if (relationshipTypeFilter !== 'all') {
      filtered = filtered.filter(r => r.relationship_type === relationshipTypeFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.primary_material?.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.secondary_material?.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredRelationships(filtered);
    setCurrentPage(1);
  }, [relationships, relationshipTypeFilter, searchQuery]);

  const saveRelationship = async (relationshipData: Omit<MaterialRelationship, 'id' | 'created_at' | 'updated_at'> & { id?: number }) => {
    try {
      if (relationshipData.id) {
        // Update existing
        const { error } = await supabase
          .from('material_relationships')
          .update({
            material_id_primary: relationshipData.material_id_primary,
            material_id_secondary: relationshipData.material_id_secondary,
            relationship_type: relationshipData.relationship_type,
            notes: relationshipData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', relationshipData.id);
          
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Relación actualizada correctamente"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('material_relationships')
          .insert([{
            material_id_primary: relationshipData.material_id_primary,
            material_id_secondary: relationshipData.material_id_secondary,
            relationship_type: relationshipData.relationship_type,
            notes: relationshipData.notes
          }]);
          
        if (error) throw error;
        
        toast({
          title: "Éxito", 
          description: "Relación creada correctamente"
        });
      }
      
      fetchData();
      setIsDialogOpen(false);
      setEditingRelationship(null);
    } catch (error) {
      console.error('Error saving relationship:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la relación",
        variant: "destructive"
      });
    }
  };

  const deleteRelationship = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta relación?')) return;
    
    try {
      const { data, error } = await supabase
        .from('material_relationships')
        .delete()
        .eq('id', id)
        .select('id');
        
      if (error) throw error;
      
      // Verify the delete actually happened
      if (!data || data.length === 0) {
        throw new Error('No se pudo eliminar la relación. Verifique los permisos.');
      }
      
      toast({
        title: "Éxito",
        description: "Relación eliminada correctamente"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la relación",
        variant: "destructive"
      });
    }
  };

  const createBulkRelationships = async (tableroId: number, cubrecantosIds: number[]) => {
    try {
      const relationships = cubrecantosIds.map(cubrecanto_id => ({
        material_id_primary: tableroId,
        material_id_secondary: cubrecanto_id,
        relationship_type: 'tablero_cubrecanto'
      }));
      
      const { error } = await supabase
        .from('material_relationships')
        .insert(relationships);
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: `${relationships.length} relaciones creadas correctamente`
      });
      
      fetchData();
      setIsBulkDialogOpen(false);
    } catch (error) {
      console.error('Error creating bulk relationships:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las relaciones",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    filterRelationships();
  }, [filterRelationships]);

  const paginatedRelationships = filteredRelationships.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredRelationships.length / itemsPerPage);

  const RelationshipForm = ({ relationship, onSave }: { 
    relationship?: MaterialRelationship | null; 
    onSave: (data: any) => void; 
  }) => {
    const [formData, setFormData] = useState({
      material_id_primary: relationship?.material_id_primary || 0,
      material_id_secondary: relationship?.material_id_secondary || 0,
      relationship_type: relationship?.relationship_type || 'tablero_cubrecanto',
      notes: relationship?.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        ...(relationship?.id && { id: relationship.id })
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="material_primary">Material Principal *</Label>
            <Select 
              value={formData.material_id_primary.toString()} 
              onValueChange={(value) => setFormData({...formData, material_id_primary: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tablero" />
              </SelectTrigger>
              <SelectContent>
                {tableros.map((tablero) => (
                  <SelectItem key={tablero.id_material} value={tablero.id_material.toString()}>
                    {tablero.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="material_secondary">Material Secundario *</Label>
            <Select 
              value={formData.material_id_secondary.toString()} 
              onValueChange={(value) => setFormData({...formData, material_id_secondary: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cubrecanto" />
              </SelectTrigger>
              <SelectContent>
                {cubrecantos.map((cubrecanto) => (
                  <SelectItem key={cubrecanto.id_material} value={cubrecanto.id_material.toString()}>
                    {cubrecanto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="relationship_type">Tipo de Relación *</Label>
          <Select 
            value={formData.relationship_type} 
            onValueChange={(value) => setFormData({...formData, relationship_type: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tablero_cubrecanto">Tablero → Cubrecanto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notas</Label>
          <Textarea 
            id="notes"
            placeholder="Comentarios adicionales sobre esta relación..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={!formData.material_id_primary || !formData.material_id_secondary}
          >
            {relationship ? 'Actualizar' : 'Crear'} Relación
          </Button>
        </div>
      </form>
    );
  };

  const BulkCreateDialog = () => {
    const [bulkFormData, setBulkFormData] = useState({
      tablero_id: 0,
      cubrecanto_ids: [] as number[]
    });

    const handleBulkSubmit = () => {
      if (bulkFormData.tablero_id && bulkFormData.cubrecanto_ids.length > 0) {
        createBulkRelationships(bulkFormData.tablero_id, bulkFormData.cubrecanto_ids);
      }
    };

    return (
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="shrink-0 h-8 px-3 text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Crear Múltiples
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Múltiples Relaciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="bulk_tablero">Seleccionar Tablero</Label>
              <Select 
                value={bulkFormData.tablero_id.toString()} 
                onValueChange={(value) => setBulkFormData({...bulkFormData, tablero_id: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tablero" />
                </SelectTrigger>
                <SelectContent>
                  {tableros.map((tablero) => (
                    <SelectItem key={tablero.id_material} value={tablero.id_material.toString()}>
                      {tablero.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Seleccionar Cubrecantos</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {cubrecantos.map((cubrecanto) => (
                  <label key={cubrecanto.id_material} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bulkFormData.cubrecanto_ids.includes(cubrecanto.id_material)}
                      onChange={(e) => {
                        const ids = bulkFormData.cubrecanto_ids;
                        if (e.target.checked) {
                          setBulkFormData({
                            ...bulkFormData,
                            cubrecanto_ids: [...ids, cubrecanto.id_material]
                          });
                        } else {
                          setBulkFormData({
                            ...bulkFormData,
                            cubrecanto_ids: ids.filter(id => id !== cubrecanto.id_material)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{cubrecanto.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleBulkSubmit}
                disabled={!bulkFormData.tablero_id || bulkFormData.cubrecanto_ids.length === 0}
              >
                Crear {bulkFormData.cubrecanto_ids.length} Relaciones
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span>Cargando relaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Controls Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Clean Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre de material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
            />
        </div>
        
          {/* Clean Filter Select */}
          <Select value={relationshipTypeFilter} onValueChange={setRelationshipTypeFilter}>
            <SelectTrigger className="w-48 h-8 border-gray-200">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="tablero_cubrecanto">Tablero → Cubrecanto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
        <BulkCreateDialog />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingRelationship(null)}
                className="h-8 px-3 bg-gray-900 hover:bg-gray-800 text-sm"
              >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Relación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="text-lg font-medium">
                {editingRelationship ? 'Editar Relación' : 'Nueva Relación'}
              </DialogTitle>
            </DialogHeader>
            <RelationshipForm relationship={editingRelationship} onSave={saveRelationship} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Enhanced Results Info & Pagination */}
      <div className="flex justify-between items-center py-1">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{paginatedRelationships.length}</span> de <span className="font-medium">{filteredRelationships.length}</span> relaciones
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Material Principal</TableHead>
              <TableHead className="w-10 px-4 py-2.5"></TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Material Secundario</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Notas</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5">Fecha</TableHead>
              <TableHead className="font-medium text-gray-900 px-4 py-2.5 w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRelationships.map((relationship) => (
              <TableRow key={relationship.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <TableCell className="px-4 py-3">
                  <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">
                    {relationship.relationship_type.replace('_', ' → ')}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {relationship.primary_material?.tipo}
                    </Badge>
                    <span className="font-medium text-gray-900">{relationship.primary_material?.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {relationship.secondary_material?.tipo}
                    </Badge>
                    <span className="font-medium text-gray-900">{relationship.secondary_material?.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 max-w-xs">
                  <span className="text-sm text-gray-600 truncate block">
                    {relationship.notes || '—'}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className="text-sm text-gray-500">
                    {new Date(relationship.created_at).toLocaleDateString('es-ES')}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRelationship(relationship);
                        setIsDialogOpen(true);
                      }}
                      className="h-7 w-7 p-0 hover:bg-gray-100"
                    >
                      <Edit className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRelationship(relationship.id)}
                      className="h-7 w-7 p-0 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
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