import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Database } from '@/types/supabase';

// Type for material
type Material = Database['public']['Tables']['materiales']['Row'];

export default async function MaterialDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const materialId = parseInt(params.id);
  
  if (isNaN(materialId)) {
    return notFound();
  }
  
  let material: Material | null = null;
  let relatedProducts = [];
  let error: Error | null = null;
  
  try {
    // Create the Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Fetch the material
    const { data: materialData, error: materialError } = await supabase
      .from('materiales')
      .select('*')
      .eq('id_material', materialId)
      .single();
    
    if (materialError) {
      throw materialError;
    }
    
    if (!materialData) {
      return notFound();
    }
    
    material = materialData;
    
    // Check multiple columns in insumos where this material might be referenced
    const columns = ['mat_huacal', 'mat_vista', 'jaladera', 'corredera', 'bisagras'];
    let references: any[] = [];
    
    for (const column of columns) {
      const { data: refs, error } = await supabase
        .from('insumos')
        .select('insumo_id, mueble')
        .eq(column, materialId);
      
      if (error) {
        console.error(`Error checking references in ${column}:`, error);
        continue;
    }
    
      if (refs && refs.length > 0) {
        references.push(...refs.map(ref => ({ ...ref, column })));
      }
    }
    
    relatedProducts = references;
    
  } catch (err) {
    console.error('Error fetching material:', err);
    error = err as Error;
  }
  
  if (error) {
    return (
      <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Detalle de Material</h1>
          <Button asChild variant="outline">
            <Link href="/productos">Volver</Link>
          </Button>
        </div>
        
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-red-800 mb-2">Error al cargar el material</h3>
            <p className="text-red-600">
              No se pudo cargar la información del material. Por favor, inténtalo de nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {material?.nombre || `Material #${materialId}`}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="shadow-sm">
            <Link href="/productos">Volver</Link>
          </Button>
          <Button asChild className="shadow-sm">
            <Link href={`/productos/materiales/${materialId}/editar`}>Editar</Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <dl className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">ID:</dt>
                <dd>{material?.id_material}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Nombre:</dt>
                <dd>{material?.nombre || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Tipo:</dt>
                <dd>{material?.tipo || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Categoría:</dt>
                <dd>{material?.categoria || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Costo:</dt>
                <dd className="font-semibold">
                  {material?.costo 
                    ? `$${Number(material.costo).toFixed(2)}` 
                    : 'No especificado'}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Comentario:</dt>
                <dd className="text-gray-600 italic">
                  {material?.comentario || 'Sin comentarios'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle>Productos Relacionados</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {relatedProducts.length > 0 ? (
              <ul className="space-y-3">
                {relatedProducts.map((product) => (
                  <li key={product.insumo_id} className="border-b pb-2 last:border-0">
                    <Link 
                      href={`/productos/${product.insumo_id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {product.mueble || `Producto #${product.insumo_id}`}
                    </Link>
                    <div className="text-sm text-gray-600 mt-1">
                      Usado como: {product.column}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                Este material no está asignado a ningún producto.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 