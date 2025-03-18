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
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';

// Type for material
type Material = Database['public']['Tables']['materiales']['Row'];

// Type for new product
type NewProducto = {
  nombre_mueble: string;
  cajones: number | null;
  puertas: number | null;
  entrepaños: number | null;
  mat_huacal: number | null;
  mat_vista: number | null;
  jaladera: number | null;
  corredera: number | null;
  bisagras: number | null;
  chap_huacal: string | null;
  chap_vista: string | null;
  patas: string | null;
  clip_patas: string | null;
  mensulas: string | null;
  kit_tornillo: string | null;
  cif: number | null;
};

export default function NuevoProductoPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [producto, setProducto] = useState<NewProducto>({
    nombre_mueble: '',
    cajones: null,
    puertas: null,
    entrepaños: null,
    mat_huacal: null,
    mat_vista: null,
    jaladera: null,
    corredera: null,
    bisagras: null,
    chap_huacal: null,
    chap_vista: null,
    patas: null,
    clip_patas: null,
    mensulas: null,
    kit_tornillo: null,
    cif: null
  });
  
  // Fetch materials data for dropdowns
  useEffect(() => {
    const fetchMateriales = async () => {
      try {
        const { data, error } = await supabase
          .from('materiales')
          .select('*')
          .order('id_material');
          
        if (error) {
          console.error('Error fetching materiales:', error);
          return;
        }
        
        setMateriales(data || []);
      } catch (err) {
        console.error('Exception fetching materiales:', err);
      }
    };
    
    fetchMateriales();
  }, [supabase]);
  
  // Get materials by category for easier selection
  const getMaterialsByCategory = (categoria: string) => {
    return materiales.filter(m => m.categoria === categoria);
  };
  
  // Handle input change for all fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert to number for numeric fields
    if (['cajones', 'puertas', 'entrepaños', 'cif'].includes(name)) {
      setProducto(prev => ({
        ...prev,
        [name]: value === '' ? null : Number(value)
      }));
    } else {
      setProducto(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle select change for dropdowns
  const handleSelectChange = (name: string, value: string) => {
    setProducto(prev => ({
      ...prev,
      [name]: value === '' ? null : Number(value)
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Validate required fields
      if (!producto.nombre_mueble) {
        setFormError('El nombre del producto es obligatorio');
        setIsSubmitting(false);
        return;
      }
      
      // Insert the new product
      const { data, error } = await supabase
        .from('inventario')
        .insert([producto])
        .select()
        .single();
      
      if (error) {
        setFormError(`Error al crear el producto: ${error.message}`);
        console.error('Error creating product:', error);
        setIsSubmitting(false);
        return;
      }
      
      // Show success message
      toast({
        title: 'Producto creado',
        description: `El producto "${producto.nombre_mueble}" ha sido creado exitosamente.`,
      });
      
      // Redirect to the products list
      router.push('/productos');
    } catch (err) {
      setFormError(`Error inesperado: ${(err as Error).message}`);
      console.error('Exception creating product:', err);
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Producto</h1>
        <Button asChild variant="outline">
          <Link href="/productos">Cancelar</Link>
        </Button>
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
            onClick={() => router.push('/productos')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </Button>
        </div>
      </form>
    </div>
  );
} 