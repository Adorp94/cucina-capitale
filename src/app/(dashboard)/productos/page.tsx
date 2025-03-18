import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Productos e Inventario | GRUPO UCMV',
  description: 'Gestión de productos y materiales',
};

export default async function ProductosPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch products data
  const { data: productos, error: productosError } = await supabase
    .from('products')
    .select('*')
    .order('name');
    
  // Fetch materials data
  const { data: materiales, error: materialesError } = await supabase
    .from('materials')
    .select('*')
    .order('name');

  if (productosError || materialesError) {
    console.error('Error fetching data:', productosError || materialesError);
  }

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
      
      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="materiales">Materiales</TabsTrigger>
        </TabsList>
        
        <TabsContent value="productos">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-5 border-b bg-gray-50">
              <CardTitle>Catálogo de Productos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="py-3">Nombre</TableHead>
                    <TableHead className="py-3">Descripción</TableHead>
                    <TableHead className="py-3">Unidad</TableHead>
                    <TableHead className="py-3">Precio Base</TableHead>
                    <TableHead className="py-3">Categoría</TableHead>
                    <TableHead className="py-3">Estado</TableHead>
                    <TableHead className="text-right py-3">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos && productos.length > 0 ? (
                    productos.map((producto) => (
                      <TableRow key={producto.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium py-3">{producto.name}</TableCell>
                        <TableCell className="py-3">{producto.description || '-'}</TableCell>
                        <TableCell className="py-3">{producto.unit || '-'}</TableCell>
                        <TableCell className="py-3">
                          ${Number(producto.base_price).toLocaleString('es-MX', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell className="py-3">{producto.category || '-'}</TableCell>
                        <TableCell className="py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            producto.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {producto.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <Button 
                            asChild 
                            size="sm" 
                            variant="outline"
                            className="shadow-sm"
                          >
                            <Link href={`/productos/${producto.id}/editar`}>
                              Editar
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay productos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="materiales">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-5 border-b bg-gray-50">
              <CardTitle>Inventario de Materiales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="py-3">Nombre</TableHead>
                    <TableHead className="py-3">Tipo</TableHead>
                    <TableHead className="py-3">Descripción</TableHead>
                    <TableHead className="py-3">Estado</TableHead>
                    <TableHead className="text-right py-3">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiales && materiales.length > 0 ? (
                    materiales.map((material) => (
                      <TableRow key={material.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium py-3">{material.name}</TableCell>
                        <TableCell className="py-3">
                          <span className="capitalize">{material.type}</span>
                        </TableCell>
                        <TableCell className="py-3">{material.description || '-'}</TableCell>
                        <TableCell className="py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            material.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {material.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <Button 
                            asChild 
                            size="sm" 
                            variant="outline"
                            className="shadow-sm"
                          >
                            <Link href={`/productos/materiales/${material.id}/editar`}>
                              Editar
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay materiales registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}