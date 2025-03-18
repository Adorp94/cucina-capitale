import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CotizacionForm from '@/components/cotizador/cotizacion-form';
import { Quotation } from '@/types/cotizacion';

// En un enfoque real, estos metadatos serían generados dinámicamente
// basados en los datos de la cotización
export const metadata: Metadata = {
  title: 'Editar Cotización | GRUPO UCMV',
  description: 'Edición de cotización existente',
};

// Mock data para la vista de ejemplo
// En producción, esto vendría de la base de datos
const MOCK_QUOTATION: Quotation = {
  id: '1',
  clientId: '1',
  number: 'COT-202503-001',
  title: 'Cotización para proyecto de cocina',
  description: 'Remodelación completa de cocina con isla central',
  projectName: 'Remodelación Residencial',
  status: 'sent',
  subtotal: 38793.10,
  taxes: 6206.90,
  total: 45000.00,
  anticipo: 31500.00,
  liquidacion: 13500.00,
  validUntil: new Date('2025-04-15'),
  deliveryTime: '4-6 semanas',
  paymentTerms: 'Anticipo 70%, Liquidación 30%',
  paymentInfo: 'BANCO XYZ\nCuenta: 000000000000\nCLABE: 000000000000000000',
  generalNotes: 'El cliente prefiere acabados mate. Se incluye visita de medición.',
  createdAt: new Date('2025-03-15'),
  updatedAt: new Date('2025-03-15'),
  terms: `
1. Los precios están sujetos a cambios sin previo aviso.
2. Esta cotización tiene una validez de 15 días.
3. Los tiempos de entrega se confirmarán al momento de la orden.
4. Se requiere un anticipo del 70% para iniciar el proyecto.
5. El precio no incluye instalación, a menos que se indique expresamente.
  `.trim(),
  notes: 'El cliente ya tiene electrodomésticos, solo requiere muebles y cubierta.',
  materialsCombination: {
    matHuacal: 'Melamina Blanca',
    chapHuacal: 'PVC Blanco',
    matVista: 'Formica Madera Nogal',
    chapVista: 'PVC Madera Nogal',
    jaladera: 'Tipo L Acero Inoxidable',
    corredera: 'Blum de extensión total',
    bisagra: 'Blum cierre suave'
  },
  items: [
    {
      id: '1',
      quotationId: '1',
      productId: '1',
      description: 'Mueble de Cocina Básico',
      area: 'Cocina',
      quantity: 2.5,
      unitPrice: 15000,
      discount: 5,
      subtotal: 35625,
      drawers: 3,
      doors: 4,
      shelves: 2,
      position: 0,
      notes: 'Con entrepaños ajustables'
    },
    {
      id: '2',
      quotationId: '1',
      productId: '3',
      description: 'Instalación Básica',
      area: 'Cocina',
      quantity: 1,
      unitPrice: 5000,
      discount: 0,
      subtotal: 5000,
      drawers: 0,
      doors: 0,
      shelves: 0,
      position: 1,
      notes: null
    },
  ]
};

export default function EditarCotizacionPage({ params }: { params: { id: string } }) {
  const id = params.id;
  // En producción, aquí se obtendría la cotización de la base de datos
  const cotizacion = MOCK_QUOTATION;
  
  return (
    <div className="container px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Editar Cotización</h1>
          <p className="text-muted-foreground">
            Modifica los detalles de esta cotización.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            asChild 
            variant="outline"
            className="shadow-sm"
          >
            <Link href={`/cotizaciones/${id}`}>
              Cancelar
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Nota: El componente CotizacionForm necesitaría adaptarse para recibir 
          datos iniciales de una cotización existente */}
      <CotizacionForm />
    </div>
  );
} 