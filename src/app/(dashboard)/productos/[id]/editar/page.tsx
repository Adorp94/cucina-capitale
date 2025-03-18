'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';

// Type for material
type Material = Database['public']['Tables']['materiales']['Row'];

// Type for product
type Producto = Database['public']['Tables']['inventario']['Row'];

export default function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = parseInt(params.id);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [producto, setProducto] = useState<Producto | null>(null);
  
  // Fetch product and materials data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFormError(null);
      
      try {
        // Fetch the product
        const { data: productoData, error: productoError } = await supabase
          .from('inventario')
          .select('*')
          .eq('mueble_id', productId)
          .single();
          
        if (productoError) {
          throw productoError;
        }
        
        if (!productoData) {
          router.push('/productos');
          toast({
            title: 'Error',
            description: 'No se encontró el producto',
            variant: 'destructive'
          });
          return;
        }
        
        setProducto(productoData);
        
        // Fetch all materials
        const { data: materialesData, error: materialesError } = await supabase
          .from('materiales')
          .select('*')
          .order('id_material');
          
        if (materialesError) {
          throw materialesError;
        }
        
        setMateriales(materialesData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setFormError(`Error al cargar los datos: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [productId, router, supabase]);
  
  // Get materials by category for easier selection
  const getMaterialsByCategory = (categoria: string) => {
    return materiales.filter(m => m.categoria === categoria);
  };
  
  // Handle input change for all fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!producto) return;
    
    const { name, value } = e.target;
    
    // Convert to number for numeric fields
    if (['cajones', 'puertas', 'entrepaños', 'cif'].includes(name)) {
      setProducto(prev => ({
        ...prev!,
        [name]: value === '' ? null : Number(value)
      }));
    } else {
      setProducto(prev => ({
        ...prev!,
        [name]: value
      }));
    }
  };
  
  // Handle select change for dropdowns
  const handleSelectChange = (name: string, value: string) => {
    if (!producto) return;
    
    setProducto(prev => ({
      ...prev!,
      [name]: value === '' ? null : Number(value)
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto) return;
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Validate required fields
      if (!producto.nombre_mueble) {
        setFormError('El nombre del producto es obligatorio');
        setIsSubmitting(false);
        return;
      }
      
      // Update the product
      const { error } = await supabase
        .from('inventario')
        .update({
          nombre_mueble: producto.nombre_mueble,
          cajones: producto.cajones,
          puertas: producto.puertas,
          entrepaños: producto.entrepaños,
          mat_huacal: producto.mat_huacal,
          mat_vista: producto.mat_vista,
          jaladera: producto.jaladera,
          corredera: producto.corredera,
          bisagras: producto.bisagras,
          chap_huacal: producto.chap_huacal,
          chap_vista: producto.chap_vista,
          patas: producto.patas,
          clip_patas: producto.clip_patas,
          mensulas: producto.mensulas,
          kit_tornillo: producto.kit_tornillo,
          cif: producto.cif
        })
        .eq('mueble_id', productId);
      
      if (error) {
        setFormError(`Error al actualizar el producto: ${error.message}`);
        console.error('Error updating product:', error);
        setIsSubmitting(false);
        return;
      }
      
      // Show success message
      toast({
        title: 'Producto actualizado',
        description: `El producto "${producto.nombre_mueble}" ha sido actualizado exitosamente.`,
      });
      
      // Redirect to the product details page
      router.push(`/productos/${productId}`);
    } catch (err) {
      setFormError(`Error inesperado: ${(err as Error).message}`);
      console.error('Exception updating product:', err);
      setIsSubmitting(false);
    }
  };
  
  // Handle product deletion
  const handleDelete = async () => {
    if (!producto) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('mueble_id', productId);
      
      if (error) {
        toast({
          title: 'Error',
          description: `Error al eliminar el producto: ${error.message}`,
          variant: 'destructive'
        });
        setIsDeleting(false);
        return;
      }
      
      toast({
        title: 'Producto eliminado',
        description: 'El producto ha sido eliminado exitosamente.'
      });
      
      router.push('/productos');
    } catch (err) {
      console.error('Exception deleting product:', err);
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
          <p className="text-gray-500">Cargando producto...</p>
        </div>
      </div>
    );
  }
  
  if (!producto) {
    return (
      <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Editar Producto</h1>
          <Button asChild variant="outline">
            <Link href="/productos">Volver</Link>
          </Button>
        </div>
        
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600">No se encontró el producto</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Editar Producto</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/productos/${productId}`}>Cancelar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Eliminarás permanentemente este producto del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Eliminar
                </AlertDialogAction>
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
        <div className="grid gap-6 mb-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_mueble">Nombre del Producto *</Label>
                    <Input
                      id="nombre_mueble"
                      name="nombre_mueble"
                      value={producto.nombre_mueble || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cif">CIF</Label>
                    <Input
                      id="cif"
                      name="cif"
                      type="number"
                      value={producto.cif?.toString() || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="cajones">Cajones</Label>
                    <Input
                      id="cajones"
                      name="cajones"
                      type="number"
                      min="0"
                      value={producto.cajones?.toString() || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="puertas">Puertas</Label>
                    <Input
                      id="puertas"
                      name="puertas"
                      type="number"
                      min="0"
                      value={producto.puertas?.toString() || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entrepaños">Entrepaños</Label>
                    <Input
                      id="entrepaños"
                      name="entrepaños"
                      type="number"
                      min="0"
                      value={producto.entrepaños?.toString() || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle>Materiales</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mat_huacal">Material Huacal</Label>
                    <Select
                      value={producto.mat_huacal?.toString() || ''}
                      onValueChange={(value) => handleSelectChange('mat_huacal', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {materiales.map((material) => (
                          <SelectItem 
                            key={`huacal-${material.id_material}`} 
                            value={material.id_material.toString()}
                          >
                            {material.nombre} ({material.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mat_vista">Material Vista</Label>
                    <Select
                      value={producto.mat_vista?.toString() || ''}
                      onValueChange={(value) => handleSelectChange('mat_vista', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {materiales.map((material) => (
                          <SelectItem 
                            key={`vista-${material.id_material}`} 
                            value={material.id_material.toString()}
                          >
                            {material.nombre} ({material.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jaladera">Jaladera</Label>
                    <Select
                      value={producto.jaladera?.toString() || ''}
                      onValueChange={(value) => handleSelectChange('jaladera', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar jaladera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {getMaterialsByCategory('Herraje').map((material) => (
                          <SelectItem 
                            key={`jaladera-${material.id_material}`} 
                            value={material.id_material.toString()}
                          >
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="corredera">Corredera</Label>
                    <Select
                      value={producto.corredera?.toString() || ''}
                      onValueChange={(value) => handleSelectChange('corredera', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar corredera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {getMaterialsByCategory('Herraje').map((material) => (
                          <SelectItem 
                            key={`corredera-${material.id_material}`} 
                            value={material.id_material.toString()}
                          >
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bisagras">Bisagras</Label>
                    <Select
                      value={producto.bisagras?.toString() || ''}
                      onValueChange={(value) => handleSelectChange('bisagras', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar bisagras" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {getMaterialsByCategory('Herraje').map((material) => (
                          <SelectItem 
                            key={`bisagras-${material.id_material}`} 
                            value={material.id_material.toString()}
                          >
                            {material.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle>Atributos Adicionales</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chap_huacal">Chapa Huacal</Label>
                  <Input
                    id="chap_huacal"
                    name="chap_huacal"
                    value={producto.chap_huacal || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chap_vista">Chapa Vista</Label>
                  <Input
                    id="chap_vista"
                    name="chap_vista"
                    value={producto.chap_vista || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patas">Patas</Label>
                  <Input
                    id="patas"
                    name="patas"
                    value={producto.patas || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clip_patas">Clip Patas</Label>
                  <Input
                    id="clip_patas"
                    name="clip_patas"
                    value={producto.clip_patas || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensulas">Mensulas</Label>
                  <Input
                    id="mensulas"
                    name="mensulas"
                    value={producto.mensulas || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kit_tornillo">Kit Tornillo</Label>
                  <Input
                    id="kit_tornillo"
                    name="kit_tornillo"
                    value={producto.kit_tornillo || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/productos/${productId}`)}
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