'use client';

import { useState } from 'react';
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

// Type for new material
type NewMaterial = {
  nombre: string;
  tipo: string | null;
  categoria: string | null;
  costo: number | null;
  comentario: string | null;
};

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

export default function NuevoMaterialPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [material, setMaterial] = useState<NewMaterial>({
    nombre: '',
    tipo: null,
    categoria: null,
    costo: null,
    comentario: null
  });
  
  // Handle input change for all fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert to number for numeric fields
    if (name === 'costo') {
      setMaterial(prev => ({
        ...prev,
        [name]: value === '' ? null : Number(value)
      }));
    } else {
      setMaterial(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle select change for dropdowns
  const handleSelectChange = (name: string, value: string) => {
    setMaterial(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Validate required fields
      if (!material.nombre) {
        setFormError('El nombre del material es obligatorio');
        setIsSubmitting(false);
        return;
      }
      
      // Insert the new material
      const { data, error } = await supabase
        .from('materiales')
        .insert([material])
        .select()
        .single();
      
      if (error) {
        setFormError(`Error al crear el material: ${error.message}`);
        console.error('Error creating material:', error);
        setIsSubmitting(false);
        return;
      }
      
      // Show success message
      toast({
        title: 'Material creado',
        description: `El material "${material.nombre}" ha sido creado exitosamente.`,
      });
      
      // Redirect to the products list
      router.push('/productos');
    } catch (err) {
      setFormError(`Error inesperado: ${(err as Error).message}`);
      console.error('Exception creating material:', err);
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Material</h1>
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
            onClick={() => router.push('/productos')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Material'}
          </Button>
        </div>
      </form>
    </div>
  );
} 