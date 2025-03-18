import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Dashboard | Cucina Capital',
  description: 'Panel de administración de cotizaciones',
};

export default function DashboardPage() {
  // En una aplicación real, estos datos vendrían de la base de datos
  const resumen = {
    cotizacionesMes: 15,
    cotizacionesPendientes: 5,
    cotizacionesAprobadas: 8,
    ventasMes: 250000,
  };

  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de Cucina Capital.
        </p>
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
              +5% respecto al mes anterior
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
              ${new Intl.NumberFormat('es-MX').format(resumen.ventasMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% respecto al mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Cotizaciones Recientes</CardTitle>
            <CardDescription>
              Has creado 15 cotizaciones este mes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Aquí irían las cotizaciones recientes desde la base de datos */}
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">COT-202503-001</p>
                  <p className="text-sm text-muted-foreground">Cliente Ejemplo 1 - Cocina Integral</p>
                </div>
                <div className="text-sm">$45,000.00</div>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">COT-202503-002</p>
                  <p className="text-sm text-muted-foreground">Cliente Ejemplo 2 - Remodelación</p>
                </div>
                <div className="text-sm">$78,500.00</div>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">COT-202503-003</p>
                  <p className="text-sm text-muted-foreground">Cliente Ejemplo 3 - Mobiliario</p>
                </div>
                <div className="text-sm">$32,800.00</div>
              </div>
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
              <Link href="/productos">
                Gestionar Productos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/reportes">
                Ver Reportes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}