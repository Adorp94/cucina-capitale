import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from 'decimal.js';

export const metadata: Metadata = {
  title: 'Dashboard | Cucina Capital',
  description: 'Panel de administración de cotizaciones',
};

export default async function DashboardPage() {
  let supabase;
  let cotizaciones = null;
  let cotizacionesError = null;
  let cotizacionesMes = null;
  
  try {
    console.log('📊 Dashboard: Starting to create Supabase client...');
    supabase = await createServerSupabaseClient();
    console.log('✅ Dashboard: Supabase client created successfully');
    
    // Fetch recent cotizaciones with clients in a single query
    console.log('🔍 Dashboard: Fetching recent cotizaciones...');
    const { data: cotizacionesData, error: cotizacionesErr } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente:clientes (
          id_cliente,
          nombre,
          correo,
          celular
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    cotizaciones = cotizacionesData;
    cotizacionesError = cotizacionesErr;
    
    if (cotizacionesErr) {
      console.error('❌ Dashboard: Error fetching cotizaciones:', cotizacionesErr);
    } else {
      console.log('✅ Dashboard: Fetched cotizaciones:', cotizacionesData?.length || 0);
    }
    
    // Calculate summary data
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Fetch cotizaciones for the current month
    console.log('🔍 Dashboard: Fetching monthly cotizaciones...');
    const { data: cotizacionesMesData, error: monthError } = await supabase
      .from('cotizaciones')
      .select('*')
      .gte('created_at', firstDayOfMonth.toISOString());
    
    cotizacionesMes = cotizacionesMesData;
    
    if (monthError) {
      console.error('❌ Dashboard: Error fetching monthly cotizaciones:', monthError);
    } else {
      console.log('✅ Dashboard: Fetched monthly cotizaciones:', cotizacionesMesData?.length || 0);
    }
    
  } catch (error) {
    console.error('🚨 Dashboard: Critical error:', error);
    cotizacionesError = error;
  }
  
  const resumen = {
    cotizacionesMes: cotizacionesMes?.length || 0,
    cotizacionesPendientes: cotizacionesMes?.filter(c => 
      c.status === 'pending' || c.status === 'draft' || 
      c.estatus === 'pendiente' || c.estatus === 'borrador'
    ).length || 0,
    cotizacionesAprobadas: cotizacionesMes?.filter(c => 
      c.status === 'approved' || c.estatus === 'aprobada'
    ).length || 0,
    ventasMes: cotizacionesMes?.reduce((sum, c) => {
      const precio = c.total ? new Decimal(c.total) : 
                     c.precio_total ? new Decimal(c.precio_total) : 
                     new Decimal(0);
      return sum.plus(precio);
    }, new Decimal(0)).toNumber() || 0,
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de Cucina Capital.
        </p>
        {cotizacionesError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-red-800 font-medium">Error de conexión a la base de datos</h3>
            <p className="text-red-600 text-sm mt-1">
              {cotizacionesError.message || 'Error desconocido al cargar los datos'}
            </p>
            <p className="text-red-500 text-xs mt-2">
              Verifica que las variables de entorno estén configuradas en Vercel.
            </p>
          </div>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cotizaciones del Mes
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.cotizacionesMes}</div>
            <p className="text-xs text-muted-foreground">
              Total del mes actual
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cotizaciones Pendientes
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.cotizacionesPendientes}</div>
            <p className="text-xs text-muted-foreground">
              Requieren seguimiento
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cotizaciones Aprobadas
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.cotizacionesAprobadas}</div>
            <p className="text-xs text-muted-foreground">
              Listas para producción
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas del Mes
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(resumen.ventasMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total del mes actual
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Cotizaciones Recientes</CardTitle>
            <CardDescription>
              {cotizaciones && cotizaciones.length > 0 
                ? `Mostrando las ${cotizaciones.length} cotizaciones más recientes.`
                : 'No hay cotizaciones recientes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cotizaciones && cotizaciones.length > 0 ? (
                cotizaciones.map((cotizacion) => (
                  <div key={cotizacion.id || cotizacion.id_cotizacion} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <Link href={`/cotizador/${cotizacion.id || cotizacion.id_cotizacion}`} className="font-medium hover:underline">
                        COT-{cotizacion.id || cotizacion.id_cotizacion}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {cotizacion.cliente?.nombre || 'Cliente sin nombre'} - {cotizacion.project_name || cotizacion.proyecto || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cotizacion.created_at ? 
                          format(new Date(cotizacion.created_at), 'PPP', { locale: es }) : 
                          'Fecha desconocida'
                        }
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {cotizacion.total ? formatCurrency(cotizacion.total) : 
                      cotizacion.precio_total ? formatCurrency(cotizacion.precio_total) : '-'}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="py-4 text-center text-muted-foreground">
                    {cotizacionesError ? 'Error al cargar cotizaciones' : 'No hay cotizaciones para mostrar'}
                  </div>
                  {cotizacionesError && (
                    <div className="py-2 text-xs text-red-500 bg-red-50 p-2 rounded-md">
                      <div><strong>Error:</strong> {cotizacionesError.message}</div>
                      {cotizacionesError.details && (
                        <div><strong>Detalles:</strong> {cotizacionesError.details}</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/cotizaciones">
                Ver todas las cotizaciones
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones principales.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild className="w-full">
              <Link href="/cotizaciones/nueva">
                Crear Nueva Cotización
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/clientes">
                Gestionar Clientes
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/datos">
                Gestionar Datos
              </Link>
            </Button>
            <Button disabled variant="outline" className="w-full cursor-not-allowed opacity-60" title="En desarrollo">
              Ver Reportes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}