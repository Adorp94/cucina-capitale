'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, Hammer, Link } from 'lucide-react';

import MaterialesManager from './materiales-manager';
import InsumosManager from './insumos-manager';
import RelationshipsManager from './relationships-manager';

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState('materiales');

  return (
    <div className="py-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Compact tab navigation */}
        <div className="mb-4">
          <TabsList className="bg-gray-50 p-1 rounded-lg border border-gray-200">
            <TabsTrigger 
              value="materiales" 
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
            <Package className="h-4 w-4" />
              <span>Materiales</span>
              <Badge variant="secondary" className="ml-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-0 font-medium">
                1,713
              </Badge>
          </TabsTrigger>
            <TabsTrigger 
              value="insumos" 
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
            <Hammer className="h-4 w-4" />
              <span>Productos</span>
              <Badge variant="secondary" className="ml-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-0 font-medium">
                99,014
              </Badge>
          </TabsTrigger>
            <TabsTrigger 
              value="relationships" 
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
            <Link className="h-4 w-4" />
              <span>Relaciones</span>
              <Badge variant="secondary" className="ml-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-0 font-medium">
                544
              </Badge>
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Compact content areas */}
        <TabsContent value="materiales" className="mt-0">
          <div className="border border-gray-200 rounded-lg bg-white">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Gestión de Materiales</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Tableros, cubrecantos, jaladeras, correderas y bisagras
              </p>
            </div>
            <div className="p-5">
              <MaterialesManager />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insumos" className="mt-0">
          <div className="border border-gray-200 rounded-lg bg-white">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Gestión de Productos</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Inventario de productos de cocina
              </p>
            </div>
            <div className="p-5">
              <InsumosManager />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="mt-0">
          <div className="border border-gray-200 rounded-lg bg-white">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Gestión de Relaciones</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Compatibilidades entre materiales
              </p>
            </div>
            <div className="p-5">
              <RelationshipsManager />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 