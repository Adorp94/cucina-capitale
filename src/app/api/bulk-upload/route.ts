import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface MaterialRecord {
  tipo?: string;
  nombre: string;
  costo?: number;
  categoria?: string;
  comentario?: string;
  subcategoria?: string;
}

interface InsumoRecord {
  categoria: string;
  descripcion: string;
  mueble: string;
  cajones?: number;
  puertas?: number;
  entrepaños?: number;
  mat_huacal?: number;
  mat_vista?: number;
  chap_huacal?: number;
  chap_vista?: number;
  jaladera?: number;
  corredera?: number;
  bisagras?: number;
  patas?: number;
  clip_patas?: number;
  mensulas?: number;
  tipon_largo?: number;
  kit_tornillo?: number;
  empaque?: string;
  cif?: number;
  tipo_mueble?: string;
  tipo?: string;
  u_tl?: number;
  t_tl?: number;
}

interface AccesorioRecord {
  accesorios: string;
  costo?: number;
  gf?: string;
  categoria?: string;
  subcategoria?: string;
  proveedor?: string;
  link?: string;
  comentario?: string;
}

interface RelacionRecord {
  tipo_relacion: string;
  material_principal: string;
  material_secundario: string;
  notas?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { table, data } = await request.json();
    
    if (!table || !data || !Array.isArray(data)) {
      return NextResponse.json({
        success: false,
        errors: ['Datos inválidos: table y data son requeridos']
      }, { status: 400 });
    }

    if (!['materiales', 'insumos', 'accesorios', 'relaciones'].includes(table)) {
      return NextResponse.json({
        success: false,
        errors: ['Tabla inválida: debe ser "materiales", "insumos", "accesorios" o "relaciones"']
      }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({
        success: false,
        errors: ['No hay datos para importar']
      }, { status: 400 });
    }

    if (data.length > 100000) {
      return NextResponse.json({
        success: false,
        errors: ['Máximo 100,000 registros por importación']
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    
    // Process data based on table type
    let processedData: any[];
    const errors: string[] = [];

    if (table === 'materiales') {
      processedData = data.map((row: any, index: number) => {
        const processed: any = {};
        
        // Clean and validate data
        if (row.tipo) processed.tipo = String(row.tipo).trim();
        if (row.nombre) processed.nombre = String(row.nombre).trim();
        if (row.categoria) processed.categoria = String(row.categoria).trim();
        if (row.comentario) processed.comentario = String(row.comentario).trim();
        if (row.subcategoria) processed.subcategoria = String(row.subcategoria).trim();
        
        // Handle numeric fields
        if (row.costo && row.costo !== '') {
          const costo = parseFloat(row.costo);
          if (!isNaN(costo)) {
            processed.costo = costo;
          } else {
            errors.push(`Fila ${index + 1}: Costo inválido: ${row.costo}`);
          }
        }

        // Validate required fields
        if (!processed.nombre) {
          errors.push(`Fila ${index + 1}: El campo 'nombre' es requerido`);
        }

        return processed;
      });
    } else if (table === 'accesorios') {
      processedData = data.map((row: any, index: number) => {
        const processed: any = {};
        
        // Clean and validate data - handle all fields
        if (row.accesorios) processed.accesorios = String(row.accesorios).trim();
        if (row.categoria) processed.categoria = String(row.categoria).trim();
        if (row.subcategoria) processed.subcategoria = String(row.subcategoria).trim();
        if (row.proveedor) processed.proveedor = String(row.proveedor).trim();
        if (row.comentario) processed.comentario = String(row.comentario).trim();
        if (row.gf) processed.gf = String(row.gf).trim();
        
        // Handle link field - allow empty/null/blank values, no validation required
        if (row.link) {
          const linkStr = String(row.link).trim();
          // Only add link if it's not empty and not 'N/A' variations
          if (linkStr !== '' && linkStr.toLowerCase() !== 'n/a' && linkStr.toLowerCase() !== 'null' && linkStr.toLowerCase() !== 'undefined') {
            processed.link = linkStr;
          }
        }
        
        // Handle numeric fields - improved costo validation for decimals
        if (row.costo !== undefined && row.costo !== null && row.costo !== '') {
          const costoStr = String(row.costo).trim();
          
          // Skip obvious non-numeric values
          if (costoStr.toLowerCase() === 'n/a' || costoStr.toLowerCase() === 'null' || costoStr.toLowerCase() === 'undefined') {
            // Skip this field, don't add it to processed
          } else {
            // Clean the string: remove currency symbols, commas, spaces
            const cleanedCosto = costoStr.replace(/[,$\s]/g, '').replace(/[^\d.-]/g, '');
            const costo = parseFloat(cleanedCosto);
            
            if (!isNaN(costo) && isFinite(costo) && costo >= 0) {
              // Round to 2 decimal places to handle floating point precision
              processed.costo = Math.round(costo * 100) / 100;
            } else {
              errors.push(`Fila ${index + 1}: Costo inválido: ${row.costo}`);
            }
          }
        }

        // Validate required fields
        if (!processed.accesorios) {
          errors.push(`Fila ${index + 1}: El campo 'accesorios' es requerido`);
        }

        return processed;
      });
    } else if (table === 'relaciones') {
      // First, we need to get material IDs for the material names, specifically filtering by type
      const { data: tablerosData, error: tablerosError } = await supabase
        .from('materiales')
        .select('id_material, nombre')
        .eq('tipo', 'Tableros');
      
      const { data: cubrecantosData, error: cubrecantosError } = await supabase
        .from('materiales')
        .select('id_material, nombre')
        .eq('tipo', 'Cubrecantos');
      
      if (tablerosError || cubrecantosError) {
        errors.push('Error al cargar materiales para validar relaciones');
        return NextResponse.json({
          success: false,
          errors
        }, { status: 400 });
      }

      // Create separate maps for tableros and cubrecantos
      const tablerosMap = new Map<string, number>();
      const cubrecantosMap = new Map<string, number>();
      
      tablerosData?.forEach(tablero => {
        tablerosMap.set(tablero.nombre.toLowerCase().trim(), tablero.id_material);
      });
      
      cubrecantosData?.forEach(cubrecanto => {
        cubrecantosMap.set(cubrecanto.nombre.toLowerCase().trim(), cubrecanto.id_material);
      });

      processedData = data.map((row: any, index: number) => {
        const processed: any = {};
        
        // Clean and validate data
        if (row.tipo_relacion) processed.relationship_type = String(row.tipo_relacion).trim();
        if (row.notas) processed.notes = String(row.notas).trim();
        
        // Find material IDs for the material names with proper type validation
        const principalName = String(row.material_principal || '').toLowerCase().trim();
        const secundarioName = String(row.material_secundario || '').toLowerCase().trim();
        
        const principalId = tablerosMap.get(principalName);
        const secundarioId = cubrecantosMap.get(secundarioName);
        
        if (!principalId) {
          errors.push(`Fila ${index + 1}: Tablero no encontrado en el catálogo: "${row.material_principal}"`);
        } else {
          processed.material_id_primary = principalId;
        }
        
        if (!secundarioId) {
          errors.push(`Fila ${index + 1}: Cubrecanto no encontrado en el catálogo: "${row.material_secundario}"`);
        } else {
          processed.material_id_secondary = secundarioId;
        }

        // Validate required fields
        if (!processed.relationship_type) {
          errors.push(`Fila ${index + 1}: El campo 'tipo_relacion' es requerido`);
        }
        if (!row.material_principal?.trim()) {
          errors.push(`Fila ${index + 1}: El campo 'material_principal' es requerido`);
        }
        if (!row.material_secundario?.trim()) {
          errors.push(`Fila ${index + 1}: El campo 'material_secundario' es requerido`);
        }

        return processed;
      });
    } else {
      // insumos
      processedData = data.map((row: any, index: number) => {
        const processed: any = {};
        
        // Clean text fields
        if (row.categoria) processed.categoria = String(row.categoria).trim();
        if (row.descripcion) processed.descripcion = String(row.descripcion).trim();
        if (row.mueble) processed.mueble = String(row.mueble).trim();
        if (row.empaque) processed.empaque = String(row.empaque).trim();
        if (row.tipo_mueble) processed.tipo_mueble = String(row.tipo_mueble).trim();
        if (row.tipo) processed.tipo = String(row.tipo).trim();
        
        // Handle numeric fields
        const numericFields = [
          'cajones', 'puertas', 'entrepaños', 'mat_huacal', 'mat_vista',
          'chap_huacal', 'chap_vista', 'jaladera', 'corredera', 'bisagras',
          'patas', 'clip_patas', 'mensulas', 'tipon_largo', 'kit_tornillo',
          'cif', 'u_tl', 't_tl'
        ];
        
        numericFields.forEach(field => {
          if (row[field] && row[field] !== '') {
            const value = parseFloat(row[field]);
            if (!isNaN(value)) {
              processed[field] = value;
            } else {
              errors.push(`Fila ${index + 1}: ${field} inválido: ${row[field]}`);
            }
          } else {
            // Set default values for certain fields
            if (['tipon_largo', 'u_tl', 't_tl'].includes(field)) {
              processed[field] = 0;
            }
          }
        });

        // Validate required fields
        if (!processed.categoria) {
          errors.push(`Fila ${index + 1}: El campo 'categoria' es requerido`);
        }
        if (!processed.descripcion) {
          errors.push(`Fila ${index + 1}: El campo 'descripcion' es requerido`);
        }
        if (!processed.mueble) {
          errors.push(`Fila ${index + 1}: El campo 'mueble' es requerido`);
        }

        return processed;
      });
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors
      }, { status: 400 });
    }

    // Insert data in batches
    const batchSize = 100;
    let totalInserted = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      
      try {
        // Map table names to actual database table names
        const dbTableName = table === 'relaciones' ? 'material_relationships' : table;
        
        const { data: insertedData, error } = await supabase
          .from(dbTableName)
          .insert(batch)
          .select('*');

        if (error) {
          console.error(`Batch ${i}-${i + batch.length} error:`, error);
          insertErrors.push(`Error en lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          totalInserted += insertedData?.length || 0;
        }
      } catch (error: any) {
        console.error(`Batch ${i}-${i + batch.length} exception:`, error);
        insertErrors.push(`Error en lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }
    }

    if (insertErrors.length > 0 && totalInserted === 0) {
      return NextResponse.json({
        success: false,
        errors: insertErrors
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inserted: totalInserted,
      errors: insertErrors // Partial errors if some batches failed
    });

  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({
      success: false,
      errors: ['Error interno del servidor']
    }, { status: 500 });
  }
} 