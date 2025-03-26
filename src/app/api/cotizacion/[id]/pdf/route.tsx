import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import CotizacionPDF from '@/components/cotizador/pdf-template';
import { DEFAULT_COTIZADOR_CONFIG } from '@/lib/cotizador/constants';
import { QuotationPDF, ClientInfo } from '@/types/pdf';
import { Decimal } from 'decimal.js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Fetch quotation data
    const { data: quotationRaw, error: quotationError } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        items:cotizacion_items (*)
      `)
      .eq('id_cotizacion', id)
      .single();

    if (quotationError || !quotationRaw) {
      return new NextResponse(
        JSON.stringify({ error: 'Quotation not found', details: quotationError }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Raw quotation data:', JSON.stringify({
      id: quotationRaw.id_cotizacion,
      subtotal: quotationRaw.subtotal,
      taxes: quotationRaw.taxes,
      total: quotationRaw.total,
      items_count: (quotationRaw.items || []).length
    }));

    // Transform to the expected QuotationPDF format
    const quotation: QuotationPDF = {
      id_cotizacion: quotationRaw.id_cotizacion,
      created_at: quotationRaw.created_at,
      project_name: quotationRaw.project_name || '',
      project_type: quotationRaw.project_type || '',
      subtotal: quotationRaw.subtotal !== undefined && quotationRaw.subtotal !== null 
        ? new Decimal(quotationRaw.subtotal) 
        : new Decimal(0),
      tax_rate: quotationRaw.tax_rate !== undefined && quotationRaw.tax_rate !== null 
        ? quotationRaw.tax_rate 
        : 0,
      taxes: quotationRaw.taxes !== undefined && quotationRaw.taxes !== null 
        ? new Decimal(quotationRaw.taxes) 
        : new Decimal(0),
      total: quotationRaw.total !== undefined && quotationRaw.total !== null 
        ? new Decimal(quotationRaw.total) 
        : new Decimal(0),
      valid_until: quotationRaw.valid_until,
      delivery_time: quotationRaw.delivery_time,
      notes: quotationRaw.notes,
      status: quotationRaw.status || 'draft',
      items: (quotationRaw.items || []).map((item: any) => ({
        id_item: item.id_item,
        description: item.descripcion || '',
        quantity: item.cantidad !== undefined && item.cantidad !== null ? item.cantidad : 0,
        unitPrice: item.precio_unitario !== undefined && item.precio_unitario !== null 
          ? new Decimal(item.precio_unitario) 
          : new Decimal(0),
        discount: item.descuento !== undefined && item.descuento !== null ? item.descuento : 0,
        subtotal: item.subtotal !== undefined && item.subtotal !== null 
          ? new Decimal(item.subtotal) 
          : new Decimal(0),
        area: item.area || '',
        position: item.posicion || 0
      }))
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
      console.log('Generating PDF for quotation:', quotation.id_cotizacion);
      const pdfBuffer = await renderToBuffer(
        <CotizacionPDF 
          quotation={quotation} 
          client={client} 
          companyInfo={DEFAULT_COTIZADOR_CONFIG.companyInfo} 
        />
      );
      
      // Set filename for download
      const filename = `cotizacion-${quotation.id_cotizacion}.pdf`;

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