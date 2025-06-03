'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Copy, Info, Package } from 'lucide-react';
import { 
  parseProjectCode, 
  generateFurnitureCode,
  getAreaName,
  getFurnitureTypeName,
  AREAS,
  FURNITURE_TYPES,
  type FurnitureCodeConfig 
} from '@/lib/project-codes';
import { useToast } from '@/components/ui/use-toast';

interface ProjectCodeDisplayProps {
  projectCode: string | null;
  projectType: string;
  items?: Array<{
    id_item: number;
    description: string;
    quantity: number;
    area?: string;
    furniture_type?: string;
    production_type?: 'A' | 'G';
  }>;
}

export function ProjectCodeDisplay({ projectCode, projectType, items = [] }: ProjectCodeDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Código copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getProjectCodeDetails = () => {
    if (!projectCode) return null;

    try {
      const details = parseProjectCode(projectCode);
      return {
        ...details,
        projectTypeText: details.typePrefix === 'RE' ? 'Residencial' : 
                        details.typePrefix === 'WN' ? 'Wen (Vertical)' :
                        details.typePrefix === 'SY' ? 'Satory (Vertical)' : 'Desconocido'
      };
    } catch (error) {
      console.error('Error parsing project code:', error);
      return null;
    }
  };

  const generateItemCodes = () => {
    if (!projectCode) return [];

    try {
      const parsedCode = parseProjectCode(projectCode);
      
      return items.map((item, index) => {
        // For demo purposes, assign areas and furniture types
        // In production, these should come from the item data or user selection
        const areas = Object.values(AREAS);
        const furnitureTypes = Object.values(FURNITURE_TYPES);
        
        const area = item.area || areas[index % areas.length];
        const furnitureType = item.furniture_type || furnitureTypes[index % furnitureTypes.length];
        
        const config: FurnitureCodeConfig = {
          projectType: parsedCode.typePrefix === 'RE' ? 'residencial' : 'vertical',
          verticalProject: parsedCode.typePrefix === 'WN' ? 'WN' : 
                          parsedCode.typePrefix === 'SY' ? 'SY' : undefined,
          date: new Date(parsedCode.year, parsedCode.month - 1),
          consecutiveNumber: parsedCode.consecutive,
          prototipo: parsedCode.prototipo,
          area: area,
          muebleType: furnitureType,
          productionType: item.production_type
        };

        const itemCode = generateFurnitureCode(config);
        
        return {
          ...item,
          code: itemCode,
          area: area,
          furnitureType: furnitureType,
          areaName: getAreaName(area),
          furnitureTypeName: getFurnitureTypeName(furnitureType)
        };
      });
    } catch (error) {
      console.error('Error generating item codes:', error);
      return [];
    }
  };

  const details = getProjectCodeDetails();
  const itemCodes = generateItemCodes();

  if (!projectCode) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2" />
            <p>Sin código de proyecto asignado</p>
            <p className="text-sm">Los códigos se generan automáticamente al crear nuevas cotizaciones</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Código de Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Project Code */}
          <div className="flex items-center gap-3">
            <div className="font-mono text-lg bg-blue-50 border border-blue-200 px-3 py-2 rounded">
              {projectCode}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(projectCode)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Info className="h-4 w-4 mr-1" />
                  Detalles
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Detalles del Código de Proyecto</DialogTitle>
                </DialogHeader>
                
                {details && (
                  <div className="space-y-6">
                    {/* Project Code Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Estructura del Código</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="font-mono text-lg bg-gray-100 p-2 rounded mb-1">
                            {details.typePrefix}
                          </div>
                          <div className="text-sm text-gray-600">Tipo</div>
                          <div className="text-sm font-medium">{details.projectTypeText}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-lg bg-gray-100 p-2 rounded mb-1">
                            {details.year.toString().slice(-1)}{details.month.toString().padStart(2, '0')}
                          </div>
                          <div className="text-sm text-gray-600">Fecha</div>
                          <div className="text-sm font-medium">{details.month}/{details.year}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-lg bg-gray-100 p-2 rounded mb-1">
                            {details.consecutive.toString().padStart(3, '0')}
                          </div>
                          <div className="text-sm text-gray-600">Consecutivo</div>
                          <div className="text-sm font-medium">#{details.consecutive}</div>
                        </div>
                        {details.prototipo && (
                          <div className="text-center">
                            <div className="font-mono text-lg bg-gray-100 p-2 rounded mb-1">
                              {details.prototipo}
                            </div>
                            <div className="text-sm text-gray-600">Prototipo</div>
                            <div className="text-sm font-medium">{details.prototipo}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Individual Item Codes */}
                    {itemCodes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Códigos de Elementos</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descripción</TableHead>
                              <TableHead>Área</TableHead>
                              <TableHead>Tipo de Mueble</TableHead>
                              <TableHead>Código Completo</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Tipo Producción</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itemCodes.map((item) => (
                              <TableRow key={item.id_item}>
                                <TableCell className="max-w-xs">
                                  <div className="truncate" title={item.description}>
                                    {item.description}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {item.area} - {item.areaName}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {item.furnitureType} - {item.furnitureTypeName}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                                    {item.code}
                                  </div>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  {item.production_type ? (
                                    <Badge variant={item.production_type === 'A' ? 'default' : 'destructive'}>
                                      {item.production_type === 'A' ? 'Adicional' : 'Garantía'}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Original</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(item.code)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Summary */}
          {details && (
            <div className="text-sm text-gray-600">
              <p>
                <strong>{details.projectTypeText}</strong> • 
                Mes {details.month}/{details.year} • 
                Proyecto #{details.consecutive}
                {details.prototipo && ` • Prototipo ${details.prototipo}`}
              </p>
            </div>
          )}

          {/* Items Count */}
          {items.length > 0 && (
            <div className="text-sm text-blue-600">
              {items.length} elemento{items.length !== 1 ? 's' : ''} en este proyecto
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 