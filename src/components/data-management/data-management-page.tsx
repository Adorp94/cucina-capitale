'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Hammer, Link } from 'lucide-react';

import MaterialesManager from './materiales-manager';
import InsumosManager from './insumos-manager';
import RelationshipsManager from './relationships-manager';

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState('materiales');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="materiales" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materiales
            <Badge variant="secondary" className="ml-2">1,713</Badge>
          </TabsTrigger>
          <TabsTrigger value="insumos" className="flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            Productos
            <Badge variant="secondary" className="ml-2">99,014</Badge>
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Relaciones
            <Badge variant="secondary" className="ml-2">544</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materiales">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Materiales</CardTitle>
              <p className="text-sm text-muted-foreground">
                Administre tableros, cubrecantos, jaladeras, correderas y bisagras
              </p>
            </CardHeader>
            <CardContent>
              <MaterialesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insumos">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Productos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Administre el inventario de productos de cocina
              </p>
            </CardHeader>
            <CardContent>
              <InsumosManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Relaciones</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure compatibilidades entre materiales
              </p>
            </CardHeader>
            <CardContent>
              <RelationshipsManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 