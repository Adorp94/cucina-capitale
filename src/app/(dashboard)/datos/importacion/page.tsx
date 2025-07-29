'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
}

interface UploadResult {
  success: boolean;
  inserted: number;
  errors: string[];
}

export default function ImportacionPage() {
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<{
    materiales: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
    insumos: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
    accesorios: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
    relaciones: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
  }>({
    materiales: 'idle',
    insumos: 'idle',
    accesorios: 'idle',
    relaciones: 'idle'
  });
  
  const [validationResults, setValidationResults] = useState<{
    materiales: ValidationResult | null;
    insumos: ValidationResult | null;
    accesorios: ValidationResult | null;
    relaciones: ValidationResult | null;
  }>({
    materiales: null,
    insumos: null,
    accesorios: null,
    relaciones: null
  });

  const [uploadResults, setUploadResults] = useState<{
    materiales: UploadResult | null;
    insumos: UploadResult | null;
    accesorios: UploadResult | null;
    relaciones: UploadResult | null;
  }>({
    materiales: null,
    insumos: null,
    accesorios: null,
    relaciones: null
  });

  // CSV Template definitions
  const materialesTemplate = [
    'tipo',
    'nombre', 
    'costo',
    'categoria',
    'comentario',
    'subcategoria'
  ];

  const insumosTemplate = [
    'categoria',
    'descripcion',
    'mueble',
    'cajones',
    'puertas',
    'entrepaños',
    'mat_huacal',
    'mat_vista',
    'chap_huacal',
    'chap_vista',
    'jaladera',
    'corredera',
    'bisagras',
    'patas',
    'clip_patas',
    'mensulas',
    'tipon_largo',
    'kit_tornillo',
    'empaque',
    'cif',
    'tipo_mueble',
    'tipo',
    'u_tl',
    't_tl'
  ];

  const accesoriosTemplate = [
    'accesorios',
    'costo',
    'categoria',
    'comentario',
    'gf',
    'subcategoria',
    'proveedor',
    'link'
  ];

  const relacionesTemplate = [
    'tipo_relacion',
    'material_principal',
    'material_secundario',
    'notas'
  ];

  const generateCSVTemplate = (table: 'materiales' | 'insumos' | 'accesorios' | 'relaciones') => {
    let headers: string[];
    let sampleData: string[];
    
    switch (table) {
      case 'materiales':
        headers = materialesTemplate;
        sampleData = ['Madera', '"Tablero MDF 18mm"', '850.50', 'Tableros', '"Material de alta calidad"', 'MDF'];
        break;
      case 'insumos':
        headers = insumosTemplate;
        sampleData = ['Mobiliario', 'Mueble de cocina base', 'Base 60cm', '2', '1', '1', '0.5', '0.3', '0.2', '0.1', '1', '2', '4', '4', '8', '2', '0', '1', 'Caja individual', '150.75', 'Base', 'Estándar', '1.2', '2.4'];
        break;
      case 'accesorios':
        headers = accesoriosTemplate;
        sampleData = ['"Basurero TIPO A 17 LTS"', '776.00', 'Accesorio', '"Tapete para proteger de humedad"', 'No', 'Basurero', 'Bulnes', 'https://cymisa.com.mx/catalogo'];
        break;
      case 'relaciones':
        headers = relacionesTemplate;
        sampleData = ['tablero_cubrecanto', '"MDF Natural 18mm"', '"Color 22 mm x 1 mm"', '"Combinación recomendada para acabados naturales"'];
        break;
      default:
        return;
    }

    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_${table}.csv`;
    link.click();

    toast({
      title: "Plantilla descargada",
      description: `La plantilla CSV para ${table} ha sido descargada exitosamente.`
    });
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    return lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line);
      const row: any = { _rowNumber: index + 2 }; // +2 because header is row 1, data starts at row 2
      
      headers.forEach((header, i) => {
        row[header.trim()] = (values[i] || '').trim();
      });
      
      return row;
    });
  };

  // Proper CSV line parser that handles quoted fields with commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote inside quoted field
          current += '"';
          i += 2;
        } else {
          // Start or end of quoted field
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator outside quotes
        result.push(current);
        current = '';
        i++;
      } else {
        // Regular character
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current);
    return result;
  };

  const validateData = (data: any[], table: 'materiales' | 'insumos' | 'accesorios' | 'relaciones'): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let expectedHeaders: string[];
    
    switch (table) {
      case 'materiales':
        expectedHeaders = materialesTemplate;
        break;
      case 'insumos':
        expectedHeaders = insumosTemplate;
        break;
      case 'accesorios':
        expectedHeaders = accesoriosTemplate;
        break;
      case 'relaciones':
        expectedHeaders = relacionesTemplate;
        break;
      default:
        expectedHeaders = [];
    }

    // Check if data is empty
    if (data.length === 0) {
      errors.push('El archivo CSV está vacío o solo contiene encabezados.');
      return { isValid: false, errors, warnings, rowCount: 0 };
    }

    // Validate headers
    const actualHeaders = Object.keys(data[0]).filter(key => key !== '_rowNumber');
    const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
    const extraHeaders = actualHeaders.filter(h => !expectedHeaders.includes(h));

    if (missingHeaders.length > 0) {
      errors.push(`Columnas faltantes: ${missingHeaders.join(', ')}`);
    }
    if (extraHeaders.length > 0) {
      warnings.push(`Columnas adicionales (se ignorarán): ${extraHeaders.join(', ')}`);
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNum = row._rowNumber;
      
      if (table === 'materiales') {
        // Required fields for materiales
        if (!row.nombre?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'nombre' es requerido.`);
        }
        if (row.costo && row.costo.toString().trim() !== '') {
          const costoStr = row.costo.toString().trim();
          // Skip obvious non-numeric values
          if (costoStr.toLowerCase() !== 'n/a' && costoStr.toLowerCase() !== 'null' && costoStr.toLowerCase() !== 'undefined') {
            // Clean the string: remove currency symbols, commas, spaces, and handle encoding issues
            let cleanedCosto = costoStr
              .replace(/[,$\s\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, '') // Remove various space characters
              .replace(/[^\d.-]/g, '') // Keep only digits, dots, and dashes
              .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
              .replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot
              
            const costo = parseFloat(cleanedCosto);
            
            if (isNaN(costo) || !isFinite(costo) || costo < 0) {
              // Add debug info to see what's being parsed
              console.log(`Debug fila ${rowNum}: original="${costoStr}", cleaned="${cleanedCosto}", parsed=${costo}`);
              errors.push(`Fila ${rowNum}: El campo 'costo' debe ser un número válido. (valor: "${costoStr}")`);
            }
          }
        }
      } else if (table === 'accesorios') {
        // Required fields for accesorios
        if (!row.accesorios?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'accesorios' es requerido.`);
        }
        if (row.costo && row.costo.toString().trim() !== '') {
          const costoStr = row.costo.toString().trim();
          // Skip obvious non-numeric values
          if (costoStr.toLowerCase() !== 'n/a' && costoStr.toLowerCase() !== 'null' && costoStr.toLowerCase() !== 'undefined') {
            // Clean the string: remove currency symbols, commas, spaces, and handle encoding issues
            let cleanedCosto = costoStr
              .replace(/[,$\s\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, '') // Remove various space characters
              .replace(/[^\d.-]/g, '') // Keep only digits, dots, and dashes
              .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
              .replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot
              
            const costo = parseFloat(cleanedCosto);
            
            if (isNaN(costo) || !isFinite(costo) || costo < 0) {
              // Add debug info to see what's being parsed
              console.log(`Debug fila ${rowNum}: original="${costoStr}", cleaned="${cleanedCosto}", parsed=${costo}`);
              errors.push(`Fila ${rowNum}: El campo 'costo' debe ser un número válido. (valor: "${costoStr}")`);
            }
          }
        }
        // Validate URL format for link if provided - allow empty/blank values
        if (row.link && row.link.trim() && row.link.trim().toLowerCase() !== 'n/a' && !row.link.startsWith('http')) {
          warnings.push(`Fila ${rowNum}: El campo 'link' debería comenzar con http:// o https://`);
        }
      } else if (table === 'relaciones') {
        // Required fields for relaciones
        if (!row.tipo_relacion?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'tipo_relacion' es requerido.`);
        }
        if (!row.material_principal?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'material_principal' es requerido.`);
        }
        if (!row.material_secundario?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'material_secundario' es requerido.`);
        }
        // Validate relationship type format - suggest tablero_cubrecanto format
        if (row.tipo_relacion && row.tipo_relacion.toLowerCase().trim() !== 'tablero_cubrecanto') {
          warnings.push(`Fila ${rowNum}: Se recomienda usar 'tablero_cubrecanto' como tipo de relación`);
        }
      } else {
        // Required fields for insumos
        if (!row.categoria?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'categoria' es requerido.`);
        }
        if (!row.descripcion?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'descripcion' es requerido.`);
        }
        if (!row.mueble?.trim()) {
          errors.push(`Fila ${rowNum}: El campo 'mueble' es requerido.`);
        }
        
        // Validate numeric fields
        const numericFields = ['cajones', 'puertas', 'entrepaños', 'mat_huacal', 'mat_vista', 
          'chap_huacal', 'chap_vista', 'jaladera', 'corredera', 'bisagras', 'patas', 
          'clip_patas', 'mensulas', 'tipon_largo', 'kit_tornillo', 'cif', 'u_tl', 't_tl'];
        
        numericFields.forEach(field => {
          if (row[field] && row[field].toString().trim() !== '') {
            const fieldStr = row[field].toString().trim();
            // Skip obvious non-numeric values
            if (fieldStr.toLowerCase() !== 'n/a' && fieldStr.toLowerCase() !== 'null' && fieldStr.toLowerCase() !== 'undefined') {
              // Clean the string: remove currency symbols, commas, spaces, and handle encoding issues
              let cleanedValue = fieldStr
                .replace(/[,$\s\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, '') // Remove various space characters
                .replace(/[^\d.-]/g, '') // Keep only digits, dots, and dashes
                .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
                .replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot
                
              const value = parseFloat(cleanedValue);
              
              if (isNaN(value) || !isFinite(value) || value < 0) {
                // Add debug info to see what's being parsed
                console.log(`Debug fila ${rowNum} field ${field}: original="${fieldStr}", cleaned="${cleanedValue}", parsed=${value}`);
                errors.push(`Fila ${rowNum}: El campo '${field}' debe ser un número válido. (valor: "${fieldStr}")`);
              }
            }
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      rowCount: data.length
    };
  };

  const handleFileUpload = async (file: File, table: 'materiales' | 'insumos' | 'accesorios' | 'relaciones') => {
    try {
      setUploadStatus(prev => ({ ...prev, [table]: 'validating' }));
      setValidationResults(prev => ({ ...prev, [table]: null }));
      setUploadResults(prev => ({ ...prev, [table]: null }));

      const text = await file.text();
      const data = parseCSV(text);
      const validation = validateData(data, table);
      
      setValidationResults(prev => ({ ...prev, [table]: validation }));

      if (!validation.isValid) {
        setUploadStatus(prev => ({ ...prev, [table]: 'error' }));
        return;
      }

      // If validation passes, proceed with upload
      setUploadStatus(prev => ({ ...prev, [table]: 'uploading' }));
      
      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table,
          data: data.map(row => {
            const { _rowNumber, ...cleanRow } = row;
            return cleanRow;
          })
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadResults(prev => ({ ...prev, [table]: result }));
        setUploadStatus(prev => ({ ...prev, [table]: 'success' }));
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${result.inserted} registros en la tabla ${table}.`
        });
      } else {
        setUploadResults(prev => ({ ...prev, [table]: result }));
        setUploadStatus(prev => ({ ...prev, [table]: 'error' }));
        toast({
          title: "Error en la importación",
          description: result.errors?.[0] || "Error desconocido",
          variant: "destructive"
        });
      }
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, [table]: 'error' }));
      toast({
        title: "Error",
        description: "Error al procesar el archivo",
        variant: "destructive"
      });
    }
  };

  const resetUpload = (table: 'materiales' | 'insumos' | 'accesorios' | 'relaciones') => {
    setUploadStatus(prev => ({ ...prev, [table]: 'idle' }));
    setValidationResults(prev => ({ ...prev, [table]: null }));
    setUploadResults(prev => ({ ...prev, [table]: null }));
  };

  const UploadSection = ({ table }: { table: 'materiales' | 'insumos' | 'accesorios' | 'relaciones' }) => {
    const status = uploadStatus[table];
    const validation = validationResults[table];
    const result = uploadResults[table];
    const [selectedFileName, setSelectedFileName] = useState<string>('');

    return (
      <div className="space-y-4">
        {/* Template Download */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paso 1: Descargar Plantilla
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Descarga la plantilla CSV con la estructura correcta para {table}.
            </p>
            <Button 
              variant="outline" 
              onClick={() => generateCSVTemplate(table)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla {table.charAt(0).toUpperCase() + table.slice(1)}
            </Button>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Paso 2: Subir Archivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor={`file-${table}`} className="text-sm font-medium">
                Seleccionar archivo CSV
              </Label>
              <div className="mt-1 relative">
                <input
                  id={`file-${table}`}
                  type="file"
                  accept=".csv"
                  disabled={status === 'validating' || status === 'uploading'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFileName(file.name);
                      handleFileUpload(file, table);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className={`
                  flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 
                  ${status === 'validating' || status === 'uploading' 
                    ? 'bg-gray-100 cursor-not-allowed text-gray-400' 
                    : 'hover:bg-gray-100 cursor-pointer'
                  }
                `}>
                  <span className={selectedFileName ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedFileName || 'Elegir archivo CSV...'}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    disabled={status === 'validating' || status === 'uploading'}
                  >
                    Explorar
                  </Button>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            {status !== 'idle' && (
              <div className="space-y-3">
                {status === 'validating' && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando archivo...
                  </div>
                )}

                {status === 'uploading' && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo datos...
                  </div>
                )}

                {validation && (
                  <Alert className={validation.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {validation.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {validation.isValid ? 'Validación exitosa' : 'Errores de validación'}
                          </span>
                          <Badge variant="outline" className="ml-auto">
                            {validation.rowCount} filas
                          </Badge>
                        </div>
                        
                        {validation.errors.length > 0 && (
                          <div className="text-sm text-red-700">
                            <p className="font-medium mb-1">Errores:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {validation.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validation.warnings.length > 0 && (
                          <div className="text-sm text-yellow-700">
                            <p className="font-medium mb-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Advertencias:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {validation.warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {result && (
                  <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {result.success ? 'Importación completada' : 'Error en la importación'}
                          </span>
                          {result.success && (
                            <Badge variant="outline" className="ml-auto">
                              {result.inserted} registros insertados
                            </Badge>
                          )}
                        </div>
                        
                        {result.errors.length > 0 && (
                          <div className="text-sm text-red-700">
                            <p className="font-medium mb-1">Errores:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {result.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetUpload(table);
                    setSelectedFileName('');
                  }}
                  className="w-full"
                >
                  Subir Otro Archivo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/datos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Datos
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Importación Masiva</h1>
            <p className="text-gray-600">Sube datos en lote para materiales, insumos, accesorios y relaciones tablero-cubrecanto</p>
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Instrucciones importantes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Descarga primero la plantilla CSV correspondiente</li>
                <li>Llena la plantilla con tus datos, respetando el formato</li>
                <li>Los campos requeridos deben tener valores válidos</li>
                <li>Los números deben usar punto (.) como separador decimal</li>
                <li>Para relaciones: Los tableros y cubrecantos deben existir en sus catálogos respectivos</li>
                <li>Guarda el archivo en formato CSV antes de subirlo</li>
                <li>Máximo 100,000 registros por importación</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Upload Tabs */}
        <Tabs defaultValue="materiales" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="materiales">Materiales</TabsTrigger>
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="accesorios">Accesorios</TabsTrigger>
            <TabsTrigger value="relaciones">Relaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="materiales">
            <UploadSection table="materiales" />
          </TabsContent>

          <TabsContent value="insumos">
            <UploadSection table="insumos" />
          </TabsContent>

          <TabsContent value="accesorios">
            <UploadSection table="accesorios" />
          </TabsContent>

          <TabsContent value="relaciones">
            <UploadSection table="relaciones" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 