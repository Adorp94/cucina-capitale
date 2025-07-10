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
  categoria?: string;
  comentario?: string;
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

    if (!['materiales', 'insumos', 'accesorios'].includes(table)) {
      return NextResponse.json({
        success: false,
        errors: ['Tabla inválida: debe ser "materiales", "insumos" o "accesorios"']
      }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({
        success: false,
        errors: ['No hay datos para importar']
      }, { status: 400 });
    }

    if (data.length > 1000) {
      return NextResponse.json({
        success: false,
        errors: ['Máximo 1000 registros por importación']
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
        
        // Clean and validate data
        if (row.accesorios) processed.accesorios = String(row.accesorios).trim();
        if (row.categoria) processed.categoria = String(row.categoria).trim();
        if (row.comentario) processed.comentario = String(row.comentario).trim();
        
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
        if (!processed.accesorios) {
          errors.push(`Fila ${index + 1}: El campo 'accesorios' es requerido`);
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
        const { data: insertedData, error } = await supabase
          .from(table)
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