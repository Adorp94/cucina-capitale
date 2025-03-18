'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';

// Type for material
type Material = Database['public']['Tables']['materiales']['Row'];

// Material types
const materialTypes = [
  'Aglomerado',
  'MDF',
  'Madera',
  'Melamina',
  'Herraje',
  'Vidrio',
  'Otros'
];

// Material categories
const materialCategories = [
  'Estructura',
  'Herraje',
  'Acabado',
  'Decorativo',
  'Otros'
];

export default function EditarMaterialPage({
  params,
}: {
  params: { id: string };
}) {
  const materialId = parseInt(params.id);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  
  // Fetch material data
  useEffect(() => {
    const fetchMaterial = async () => {
      setIsLoading(true);
      setFormError(null);
      
      try {
        // Fetch the material
        const { data, error } = await supabase
          .from('materiales')
          .select('*')
          .eq('id_material', materialId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          router.push('/productos');
          toast({
            title: 'Error',
            description: 'No se encontró el material',
            variant: 'destructive'
          });
          return;
        }
        
        setMaterial(data);
      } catch (err) {
        console.error('Error fetching material:', err);
        setFormError(`Error al cargar los datos: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaterial();
  }, [materialId, router, supabase]);
  
  // Check if material is used in any products
  const [relatedProducts, setRelatedProducts] = useState<number>(0);
  useEffect(() => {
    const checkRelations = async () => {
      try {
        // Check multiple columns in inventario where this material might be referenced
        const columns = ['mat_huacal', 'mat_vista', 'jaladera', 'corredera', 'bisagras'];
        let totalCount = 0;
        
        for (const column of columns) {
          const { count, error } = await supabase
            .from('inventario')
            .select('mueble_id', { count: 'exact', head: true })
            .eq(column, materialId);
            
          if (error) {
            console.error(`Error checking references in ${column}:`, error);
            continue;
          }
          
          totalCount += count || 0;
        }
        
        setRelatedProducts(totalCount);
      } catch (err) {
        console.error('Error checking material references:', err);
      }
    };
    
    if (material) {
      checkRelations();
    }
  }, [material, materialId, supabase]);
  
  // Handle input change for all fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!material) return;
    
    const { name, value } = e.target;
    
    // Convert to number for numeric fields
    if (name === 'costo') {
      setMaterial(prev => ({
        ...prev!,
        [name]: value === '' ? null : Number(value)
      }));
    } else {
      setMaterial(prev => ({
        ...prev!,
        [name]: value
      }));
    }
  };
  
  // Handle select change for dropdowns
  const handleSelectChange = (name: string, value: string) => {
    if (!material) return;
    
    setMaterial(prev => ({
      ...prev!,
      [name]: value === '' ? null : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Validate required fields
      if (!material.nombre) {
        setFormError('El nombre del material es obligatorio');
        setIsSubmitting(false);
        return;
      }
      
      // Update the material
      const { error } = await supabase
        .from('materiales')
        .update({
          nombre: material.nombre,
          tipo: material.tipo,
          categoria: material.categoria,
          costo: material.costo,
          comentario: material.comentario
        })
        .eq('id_material', materialId);
      
      if (error) {
        setFormError(`Error al actualizar el material: ${error.message}`);
        console.error('Error updating material:', error);
        setIsSubmitting(false);
        return;
      }
      
      // Show success message
      toast({
        title: 'Material actualizado',
        description: `El material "${material.nombre}" ha sido actualizado exitosamente.`,
      });
      
      // Redirect to the material details page
      router.push(`/productos/materiales/${materialId}`);
    } catch (err) {
      setFormError(`Error inesperado: ${(err as Error).message}`);
      console.error('Exception updating material:', err);
      setIsSubmitting(false);
    }
  };
  
  // Handle material deletion
  const handleDelete = async () => {
    if (!material) return;
    
    setIsDeleting(true);
    
    try {
      // Check if material is used in any products
      if (relatedProducts > 0) {
        toast({
          title: 'No se puede eliminar',
          description: `Este material está siendo utilizado en ${relatedProducts} producto(s).`,
          variant: 'destructive'
        });
        setIsDeleting(false);
        return;
      }
      
      const { error } = await supabase
        .from('materiales')
        .delete()
        .eq('id_material', materialId);
      
      if (error) {
        toast({
          title: 'Error',
          description: `Error al eliminar el material: ${error.message}`,
          variant: 'destructive'
        });
        setIsDeleting(false);
        return;
      }
      
      toast({
        title: 'Material eliminado',
        description: 'El material ha sido eliminado exitosamente.'
      });
      
      router.push('/productos');
    } catch (err) {
      console.error('Exception deleting material:', err);
      toast({
        title: 'Error',
        description: `Error inesperado: ${(err as Error).message}`,
        variant: 'destructive'
      });
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">Cargando material...</p>
        </div>
      </div>
    );
  }
  
  if (!material) {
    return (
      <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Editar Material</h1>
          <Button asChild variant="outline">
            <Link href="/productos">Volver</Link>
          </Button>
        </div>
        
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600">No se encontró el material</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Editar Material</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/productos/materiales/${materialId}`}>Cancelar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting || relatedProducts > 0}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  {relatedProducts > 0 
                    ? `No puedes eliminar este material porque está siendo utilizado en ${relatedProducts} producto(s).`
                    : 'Esta acción no se puede deshacer. Eliminarás permanentemente este material del sistema.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                {relatedProducts === 0 && (
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Eliminar
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {formError && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600">{formError}</p>
          </CardContent>
        </Card>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm mb-6">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle>Información del Material</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Material *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={material.nombre || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Material</Label>
                  <Select
                    value={material.tipo || ''}
                    onValueChange={(value) => handleSelectChange('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No especificado</SelectItem>
                      {materialTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={material.categoria || ''}
                    onValueChange={(value) => handleSelectChange('categoria', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No especificado</SelectItem>
                      {materialCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="costo">Costo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2">$</span>
                  <Input
                    id="costo"
                    name="costo"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    value={material.costo?.toString() || ''}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Costo unitario del material sin impuestos
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comentario">Comentario</Label>
                <Textarea
                  id="comentario"
                  name="comentario"
                  className="resize-none"
                  value={material.comentario || ''}
                  onChange={handleChange}
                  placeholder="Información adicional sobre este material"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/productos/materiales/${materialId}`)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
} 