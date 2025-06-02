import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Database } from '@/types/supabase';

// Types for product and material
type Producto = Database['public']['Tables']['insumos']['Row'];
type Material = Database['public']['Tables']['materiales']['Row'];

// Type for product with related materials
interface ProductoWithMaterials extends Producto {
  materialHuacal?: Material;
  materialVista?: Material;
  jaladera?: Material;
  corredera?: Material;
  bisagras?: Material;
}

export default async function ProductoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = parseInt(params.id);
  
  if (isNaN(productId)) {
    return notFound();
  }
  
  let producto: ProductoWithMaterials | null = null;
  let error: Error | null = null;
  
  try {
    // Create the Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Fetch the product
    const { data: productoData, error: productoError } = await supabase
      .from('insumos')
      .select('*')
      .eq('insumo_id', productId)
      .single();
    
    if (productoError) {
      throw productoError;
    }
    
    if (!productoData) {
      return notFound();
    }
    
    // Start with the basic product
    producto = productoData;
    
    // Create an array of material IDs to fetch
    const materialIds: number[] = [];
    if (producto.mat_huacal) materialIds.push(producto.mat_huacal);
    if (producto.mat_vista) materialIds.push(producto.mat_vista);
    if (producto.jaladera) materialIds.push(producto.jaladera);
    if (producto.corredera) materialIds.push(producto.corredera);
    if (producto.bisagras) materialIds.push(producto.bisagras);
    
    if (materialIds.length > 0) {
      // Fetch all related materials in a single query
      const { data: materialesData, error: materialesError } = await supabase
        .from('materiales')
        .select('*')
        .in('id_material', materialIds);
      
      if (materialesError) {
        throw materialesError;
      }
      
      // Assign the materials to the product
      if (materialesData) {
        // Create a map for faster lookups
        const materialsMap = new Map(
          materialesData.map((material) => [material.id_material, material])
        );
        
        // Assign materials to the product
        if (producto.mat_huacal && materialsMap.has(producto.mat_huacal)) {
          producto.materialHuacal = materialsMap.get(producto.mat_huacal);
        }
        
        if (producto.mat_vista && materialsMap.has(producto.mat_vista)) {
          producto.materialVista = materialsMap.get(producto.mat_vista);
        }
        
        if (producto.jaladera && materialsMap.has(producto.jaladera)) {
          producto.jaladera = materialsMap.get(producto.jaladera);
        }
        
        if (producto.corredera && materialsMap.has(producto.corredera)) {
          producto.corredera = materialsMap.get(producto.corredera);
        }
        
        if (producto.bisagras && materialsMap.has(producto.bisagras)) {
          producto.bisagras = materialsMap.get(producto.bisagras);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching product:', err);
    error = err as Error;
  }
  
  if (error) {
    return (
      <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Detalle de Producto</h1>
          <Button asChild variant="outline">
            <Link href="/productos">Volver</Link>
          </Button>
        </div>
        
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-red-800 mb-2">Error al cargar el producto</h3>
            <p className="text-red-600">
              No se pudo cargar la información del producto. Por favor, inténtalo de nuevo.
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
          {producto?.mueble || `Producto #${productId}`}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="shadow-sm">
            <Link href="/productos">Volver</Link>
          </Button>
          <Button asChild className="shadow-sm">
            <Link href={`/productos/${productId}/editar`}>Editar</Link>
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
                <dd>{producto?.insumo_id}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Nombre:</dt>
                <dd>{producto?.mueble || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">CIF:</dt>
                <dd>{producto?.cif || 'No especificado'}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                  <span className="text-2xl font-bold">{producto?.cajones || '0'}</span>
                  <span className="text-sm text-gray-600">Cajones</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                  <span className="text-2xl font-bold">{producto?.puertas || '0'}</span>
                  <span className="text-sm text-gray-600">Puertas</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                  <span className="text-2xl font-bold">{producto?.entrepaños || '0'}</span>
                  <span className="text-sm text-gray-600">Entrepaños</span>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle>Materiales Asignados</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Material Huacal:</dt>
                <dd>
                  {producto?.materialHuacal ? (
                    <Link href={`/productos/materiales/${producto.materialHuacal.id_material}`} className="text-blue-600 hover:underline">
                      {producto.materialHuacal.nombre}
                    </Link>
                  ) : producto?.mat_huacal ? (
                    `ID: ${producto.mat_huacal}`
                  ) : (
                    'No asignado'
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Material Vista:</dt>
                <dd>
                  {producto?.materialVista ? (
                    <Link href={`/productos/materiales/${producto.materialVista.id_material}`} className="text-blue-600 hover:underline">
                      {producto.materialVista.nombre}
                    </Link>
                  ) : producto?.mat_vista ? (
                    `ID: ${producto.mat_vista}`
                  ) : (
                    'No asignado'
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Jaladera:</dt>
                <dd>
                  {producto?.jaladera ? (
                    <Link href={`/productos/materiales/${producto.jaladera.id_material}`} className="text-blue-600 hover:underline">
                      {producto.jaladera.nombre}
                    </Link>
                  ) : producto?.jaladera ? (
                    `ID: ${producto.jaladera}`
                  ) : (
                    'No asignado'
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Corredera:</dt>
                <dd>
                  {producto?.corredera ? (
                    <Link href={`/productos/materiales/${producto.corredera.id_material}`} className="text-blue-600 hover:underline">
                      {producto.corredera.nombre}
                    </Link>
                  ) : producto?.corredera ? (
                    `ID: ${producto.corredera}`
                  ) : (
                    'No asignado'
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Bisagras:</dt>
                <dd>
                  {producto?.bisagras ? (
                    <Link href={`/productos/materiales/${producto.bisagras.id_material}`} className="text-blue-600 hover:underline">
                      {producto.bisagras.nombre}
                    </Link>
                  ) : producto?.bisagras ? (
                    `ID: ${producto.bisagras}`
                  ) : (
                    'No asignado'
                  )}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle>Otros Atributos</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Chapa Huacal:</dt>
                <dd>{producto?.chap_huacal || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Chapa Vista:</dt>
                <dd>{producto?.chap_vista || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Patas:</dt>
                <dd>{producto?.patas || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Clip Patas:</dt>
                <dd>{producto?.clip_patas || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Mensulas:</dt>
                <dd>{producto?.mensulas || 'No especificado'}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="font-medium text-gray-600 min-w-36">Kit Tornillo:</dt>
                <dd>{producto?.kit_tornillo || 'No especificado'}</dd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 