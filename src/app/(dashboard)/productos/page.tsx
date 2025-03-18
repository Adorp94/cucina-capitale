import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductosTable from '@/components/productos/productos-table';
import MaterialesTable from '@/components/productos/materiales-table';
import Debugger from '@/components/debugger';

// Define types that match the component expectations
type Producto = {
  mueble_id: number;
  nombre_mueble: string | null;
  cajones: number | null;
  puertas: number | null;
  entrepaños: number | null;
  mat_huacal: number | null;
  mat_vista: number | null;
  chap_huacal: number | null;
  chap_vista: number | null;
  jaladera: number | null;
  corredera: number | null;
  bisagras: number | null;
  patas: number | null;
  clip_patas: number | null;
  mensulas: number | null;
  kit_tornillo: number | null;
  cif: number | null;
};

type Material = {
  id_material: number;
  tipo: string | null;
  nombre: string | null;
  costo: number | null;
  categoria: string | null;
  comentario: string | null;
};

export default async function ProductosPage() {
  let productos: Producto[] = [];
  let materiales: Material[] = [];
  let error: Error | null = null;
  let errorDetails = '';
  
  try {
    // Log environment variables (redacted for security)
    console.log('Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase ANON KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Create the Supabase client
    console.log('Creating Supabase client...');
    const supabase = await createServerSupabaseClient();
    
    console.log('Supabase client created, attempting to fetch data');
    
    try {
      // Fetch products data from "inventario" table
      console.log('Fetching inventario data...');
      const { data: productosData, error: productosError } = await supabase
        .from('inventario')
        .select('*')
        .order('mueble_id');
        
      if (productosError) {
        console.error('Error fetching inventario:', productosError);
        console.error('Error code:', productosError.code);
        console.error('Error message:', productosError.message);
        console.error('Error details:', productosError.details);
        errorDetails += `Error fetching inventario: ${productosError.message || JSON.stringify(productosError)}. `;
        error = new Error(`Error fetching inventario: ${productosError.message || JSON.stringify(productosError)}`);
      } else {
        console.log('Successfully fetched inventario data:', productosData?.length || 0, 'records');
        if (productosData?.length === 0) {
          console.log('No inventario records found - table might be empty');
        } else {
          console.log('First inventario record:', JSON.stringify(productosData[0]));
        }
        // Cast to any first to handle possible field mismatches
        productos = (productosData || []) as any[];
      }
    } catch (inventarioErr) {
      console.error('Exception fetching inventario:', inventarioErr);
      console.error('Exception details:', JSON.stringify(inventarioErr));
      errorDetails += `Exception fetching inventario: ${(inventarioErr as Error).message}. `;
    }
    
    try {
      // Fetch materials data from "materiales" table
      console.log('Fetching materiales data...');
      const { data: materialesData, error: materialesError } = await supabase
        .from('materiales')
        .select('*')
        .order('id_material');

      if (materialesError) {
        console.error('Error fetching materiales:', materialesError);
        console.error('Error code:', materialesError.code);
        console.error('Error message:', materialesError.message);
        console.error('Error details:', materialesError.details);
        errorDetails += `Error fetching materiales: ${materialesError.message || JSON.stringify(materialesError)}. `;
        if (!error) {
          error = new Error(`Error fetching materiales: ${materialesError.message || JSON.stringify(materialesError)}`);
        }
      } else {
        console.log('Successfully fetched materiales data:', materialesData?.length || 0, 'records');
        if (materialesData?.length === 0) {
          console.log('No materiales records found - table might be empty');
        } else {
          console.log('First materiales record:', JSON.stringify(materialesData[0]));
        }
        // Cast to any first to handle possible field mismatches 
        materiales = (materialesData || []) as any[];
      }
    } catch (materialesErr) {
      console.error('Exception fetching materiales:', materialesErr);
      errorDetails += `Exception fetching materiales: ${(materialesErr as Error).message}. `;
    }
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    error = err as Error;
    errorDetails = `Error creating Supabase client: ${(err as Error).message}`;
  }

  // Handle the case when the tables might not exist
  const tablesExist = !error || (productos.length > 0 || materiales.length > 0);

  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Productos e Inventario</h1>
          <p className="text-muted-foreground">
            Gestiona tus productos y materiales de inventario.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="shadow-sm">
            <Link href="/productos/nuevo">
              Nuevo Producto
            </Link>
          </Button>
          <Button asChild variant="outline" className="shadow-sm">
            <Link href="/productos/nuevo-material">
              Nuevo Material
            </Link>
          </Button>
        </div>
      </div>
      
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-red-800 mb-2">Error al cargar datos</h3>
            <p className="text-red-600 mb-2">Por favor verifica tu conexión a la base de datos.</p>
            {errorDetails && (
              <details className="text-sm text-red-700 bg-red-100 p-3 rounded-md">
                <summary className="cursor-pointer font-medium">Detalles del error</summary>
                <p className="mt-2 whitespace-pre-wrap">{errorDetails}</p>
              </details>
            )}
          </CardContent>
        </Card>
      )}
      
      {!tablesExist ? (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Tablas no encontradas</h3>
            <p className="text-yellow-700">
              Es posible que las tablas "inventario" y "materiales" no existan en tu base de datos Supabase. 
              Por favor, crea estas tablas o verifica que las credenciales sean correctas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Debugger data={{ productos, materiales }} title="Datos cargados de Supabase" />
          
          <Tabs defaultValue="productos" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="productos">Productos</TabsTrigger>
              <TabsTrigger value="materiales">Materiales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="productos">
              <Card className="shadow-sm">
                <CardHeader className="px-6 py-5 border-b bg-gray-50">
                  <CardTitle>Catálogo de Productos</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ProductosTable productos={productos} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="materiales">
              <Card className="shadow-sm">
                <CardHeader className="px-6 py-5 border-b bg-gray-50">
                  <CardTitle>Inventario de Materiales</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <MaterialesTable materiales={materiales} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}