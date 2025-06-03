import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CotizacionPDF from '@/components/cotizador/pdf-template';
import { DEFAULT_COTIZADOR_CONFIG } from '@/lib/cotizador/constants';
import { QuotationPDF, ClientInfo } from '@/types/pdf';
import { Decimal } from 'decimal.js';

// Utility function to parse quotation items
function parseQuotationItems(quotationData: any) {
  try {
    if (!quotationData.items || !quotationData.items.length) {
      console.log('No items found in quotation');
      return [];
    }
    
    // If items is already an array, ensure each item has all required fields
    if (Array.isArray(quotationData.items)) {
      console.log(`Found ${quotationData.items.length} items as array`);
      
      // Log the first item to see its structure
      if (quotationData.items.length > 0) {
        console.log('First raw item structure:', JSON.stringify(
          Object.keys(quotationData.items[0])
        ));
      }
      
      return quotationData.items.map((item, index) => {
        // Check for different possible field names based on database structure (Spanish/English)
        const description = item.description || item.descripcion || `Item ${index + 1}`;
        const quantity = Number(item.quantity || item.cantidad || 0);
        
        // Handle unit price with all possible field names
        let unitPrice;
        if (item.unitPrice && !isNaN(Number(item.unitPrice))) {
          unitPrice = new Decimal(item.unitPrice);
        } else if (item.unit_price && !isNaN(Number(item.unit_price))) {
          unitPrice = new Decimal(item.unit_price);
        } else if (item.precio_unitario && !isNaN(Number(item.precio_unitario))) {
          unitPrice = new Decimal(item.precio_unitario);
        } else {
          unitPrice = new Decimal(0);
        }
        
        // Handle discount
        const discount = Number(item.discount || item.descuento || 0);
        
        // Handle subtotal
        let subtotal;
        if (item.subtotal && !isNaN(Number(item.subtotal))) {
          subtotal = new Decimal(item.subtotal);
        } else {
          // Calculate subtotal if not provided
          const baseAmount = new Decimal(quantity).mul(unitPrice);
          const discountAmount = baseAmount.mul(new Decimal(discount).div(100));
          subtotal = baseAmount.minus(discountAmount);
        }
        
        console.log(`Mapping item ${index}:`, { 
          description, 
          quantity, 
          unitPrice: unitPrice.toString(), 
          discount, 
          subtotal: subtotal.toString() 
        });
        
        return {
          id: item.id || item.id_item || `item-${index}`,
          description,
          quantity,
          unitPrice,
          discount,
          subtotal
        };
      });
    }
    
    // If items is a string, try to parse it as JSON
    if (typeof quotationData.items === 'string') {
      console.log('Items found as string, parsing JSON');
      const parsedItems = JSON.parse(quotationData.items);
      
      if (Array.isArray(parsedItems)) {
        return parsedItems.map((item, index) => ({
          id: item.id || `item-${index}`,
          description: item.description || `Item ${index + 1}`,
          quantity: Number(item.quantity) || 0,
          unitPrice: item.unitPrice ? new Decimal(item.unitPrice) : new Decimal(0),
          discount: Number(item.discount) || 0,
          subtotal: item.subtotal ? new Decimal(item.subtotal) : new Decimal(0),
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing quotation items:', error);
    return [];
  }
}

// Utility function to parse materials from cotizacion_materiales array
function parseMaterials(quotationData: any) {
  try {
    // Check if there's materials data in the joined table
    if (quotationData.cotizacion_materiales && 
        Array.isArray(quotationData.cotizacion_materiales) && 
        quotationData.cotizacion_materiales.length > 0) {
      
      console.log(`Found ${quotationData.cotizacion_materiales.length} materials in cotizacion_materiales array`);
      
      // Create a map of material types to their corresponding material information
      const materialsMap: Record<string, any> = {};
      
      // Loop through materials and organize by type
      quotationData.cotizacion_materiales.forEach((material: any) => {
        if (material.tipo && material.id_material) {
          console.log(`Found material of type "${material.tipo}" with id ${material.id_material}`);
          
          // Store material by its type
          materialsMap[material.tipo] = {
            id: material.id_material,
            costo: material.costo_usado || 0
          };
        }
      });
      
      return materialsMap;
    }
    
    console.log('No materials found in cotizacion_materiales array');
    return {};
  } catch (error) {
    console.error('Error parsing materials:', error);
    return {};
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if we're in debug mode
    const url = new URL(request.url);
    const debug = url.searchParams.get('debug') === 'true';
    
    const id = params.id;
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Fetch quotation data with joined materials using Spanish table names
    const { data: quotationRaw, error: quotationError } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        items:cotizacion_items (*),
        cotizacion_materiales(*)
      `)
      .eq('id_cotizacion', id)
      .single();

    if (quotationError || !quotationRaw) {
      return new NextResponse(
        JSON.stringify({ error: 'Quotation not found', details: quotationError }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In debug mode, return the raw data
    if (debug) {
      return new NextResponse(
        JSON.stringify({ 
          rawData: quotationRaw,
          keys: Object.keys(quotationRaw),
          materialKeys: quotationRaw.cotizacion_materiales ? 
            (Array.isArray(quotationRaw.cotizacion_materiales) && quotationRaw.cotizacion_materiales.length > 0 ? 
              Object.keys(quotationRaw.cotizacion_materiales[0]) : 
              'No materials data'
            ) : 'No materials field',
        }, null, 2),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Quotation raw data:', {
      id: quotationRaw.id_cotizacion,
      subtotal: quotationRaw.subtotal,
      taxes: quotationRaw.taxes,
      total: quotationRaw.total,
      project_type: quotationRaw.project_type,
      items_count: (quotationRaw.items || []).length,
      delivery_time: quotationRaw.delivery_time,
      materialsCount: quotationRaw.cotizacion_materiales ? 
        (Array.isArray(quotationRaw.cotizacion_materiales) ? 
          quotationRaw.cotizacion_materiales.length : 'Not array') : 
        'No materials'
    });

    // Debug raw items data
    if (quotationRaw.items && quotationRaw.items.length > 0) {
      console.log('Raw items sample:', JSON.stringify(quotationRaw.items[0]));
    }
    
    // Map project type to text
    const projectTypeMap: Record<string, string> = {
      '1': 'Residencial',
      '2': 'Comercial',
      '3': 'Desarrollo',
      '4': 'Institucional',
    };
    
    console.log('Raw project_type:', quotationRaw.project_type);
    console.log('Project type (toString):', quotationRaw.project_type?.toString());
    
    const projectTypeText = projectTypeMap[quotationRaw.project_type?.toString()] || 'No especificado';
    console.log('Mapped project type text:', projectTypeText);
    
    // Parse items and materials
    const parsedItems = parseQuotationItems(quotationRaw);
    const materialsMap = parseMaterials(quotationRaw);
    
    // Fetch material names from the materials table
    console.log('Fetching material names for IDs:', Object.values(materialsMap).map((m: any) => m.id));
    
    const materialIds = Object.values(materialsMap).map((m: any) => m.id);
    let parsedMaterials: Record<string, string> = {};
    
    if (materialIds.length > 0) {
      // Fetch material names from the materials table
      const { data: materialsData, error: materialsError } = await supabase
        .from('materiales')
        .select('id_material, nombre')
        .in('id_material', materialIds);
      
      if (!materialsError && materialsData) {
        console.log(`Found ${materialsData.length} materials in materiales table`);
        
        // Create a map of material IDs to names
        const materialNamesById: Record<number, string> = {};
        materialsData.forEach((mat: any) => {
          materialNamesById[mat.id_material] = mat.nombre;
        });
        
        // Map the material types to their corresponding names
        for (const [tipo, material] of Object.entries(materialsMap)) {
          const materialId = (material as any).id;
          const materialName = materialNamesById[materialId];
          
          if (materialName) {
            parsedMaterials[tipo] = materialName;
            console.log(`Mapped material type "${tipo}" to name "${materialName}"`);
          }
        }
      } else {
        console.error('Error fetching material names:', materialsError);
      }
    }
    
    console.log(`Mapped ${Object.keys(parsedMaterials).length} materials to their names`);
    
    // Sample item debug if available
    if (parsedItems.length > 0) {
      console.log('Sample parsed item:', {
        description: parsedItems[0].description,
        quantity: parsedItems[0].quantity,
        unitPrice: parsedItems[0].unitPrice.toString()
      });
    }
    
    // Sample material debug if available
    const materialKeys = Object.keys(parsedMaterials);
    if (materialKeys.length > 0) {
      console.log('Sample material:', {
        key: materialKeys[0],
        value: parsedMaterials[materialKeys[0]]
      });
    }
    
    // Transform quotation data to PDF format
    const quotationForPDF: QuotationPDF = {
      id_cotizacion: parseInt(quotationRaw.id_cotizacion),
      project_name: quotationRaw.project_name || quotationRaw.nombre_proyecto || '',
      project_code: quotationRaw.project_code || '',
      project_type: projectTypeText,
      total: new Decimal(quotationRaw.total || 0),
      subtotal: new Decimal(quotationRaw.subtotal || 0),
      taxes: new Decimal(quotationRaw.taxes || quotationRaw.impuestos || 0),
      tax_rate: parseFloat(quotationRaw.tax_rate || quotationRaw.tasa_impuesto || 0),
      created_at: quotationRaw.created_at || quotationRaw.fecha_creacion,
      delivery_time: `${quotationRaw.delivery_time || quotationRaw.tiempo_entrega || 0} días`,
      status: quotationRaw.status || "draft",
      valid_until: quotationRaw.valid_until || quotationRaw.valido_hasta,
      notes: quotationRaw.notes || quotationRaw.notas || '',
      items: parsedItems,
      materials: parsedMaterials,
    };
    
    // Fetch client data
    const { data: clientRaw, error: clientError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id_cliente', quotationRaw.id_cliente)
      .single();

    if (clientError || !clientRaw) {
      return new NextResponse(
        JSON.stringify({ error: 'Client not found', details: clientError }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform client data
    const client: ClientInfo = {
      id_cliente: clientRaw.id_cliente,
      nombre: clientRaw.nombre,
      correo: clientRaw.correo,
      celular: clientRaw.celular,
      direccion: clientRaw.direccion,
      rfc: clientRaw.rfc
    };

    // Generate PDF
    try {
      console.log('Generating PDF for quotation:', quotationForPDF.id_cotizacion);
      const pdfBuffer = await renderToBuffer(
        <CotizacionPDF 
          quotation={quotationForPDF} 
          client={client} 
          companyInfo={DEFAULT_COTIZADOR_CONFIG.companyInfo} 
        />
      );
      
      // Set filename for download
      const filename = `cotizacion-${quotationForPDF.id_cotizacion}.pdf`;

      // Return PDF as response
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (pdfError) {
      console.error('Error in renderToBuffer:', pdfError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'PDF rendering failed', 
          details: pdfError instanceof Error 
            ? { message: pdfError.message, stack: pdfError.stack } 
            : pdfError 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in PDF generation process:', error);
    
    // Enhanced error handling with more details
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : { error };
      
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate PDF', 
        details: errorDetails 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 