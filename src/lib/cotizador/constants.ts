import { CotizadorConfig } from '@/types/cotizacion';

// Configuración predeterminada del cotizador
export const DEFAULT_COTIZADOR_CONFIG: CotizadorConfig = {
  taxRate: 16, // IVA en México (16%)
  defaultTerms: `
1. Los precios están sujetos a cambios sin previo aviso.
2. Esta cotización tiene una validez de 30 días.
3. Los tiempos de entrega se confirmarán al momento de la orden.
4. Se requiere un anticipo del 50% para iniciar el proyecto.
5. El precio no incluye instalación, a menos que se indique expresamente.
  `.trim(),
  validityDays: 30,
  companyInfo: {
    name: 'Cucina Capital',
    logo: '/logo.png',
    address: 'Av. Principal #123, Col. Centro, Ciudad de México, CP 01000',
    phone: '+52 55 1234 5678',
    email: 'contacto@cucinacapital.com',
    website: 'www.cucinacapital.com',
    rfc: 'CCA123456ABC',
  },
};

// Categorías de productos
export const PRODUCT_CATEGORIES = [
  'Mobiliario',
  'Electrodomésticos',
  'Acabados',
  'Accesorios',
  'Instalación',
  'Servicios',
  'Otros',
];

// Unidades de medida
export const UNITS = [
  'm²', // metros cuadrados
  'm', // metros lineales
  'pieza',
  'juego',
  'servicio',
  'hora',
  'día',
];

// Estados de cotización
export const QUOTATION_STATUSES = {
  draft: { label: 'Borrador', color: 'gray' },
  sent: { label: 'Enviada', color: 'blue' },
  approved: { label: 'Aprobada', color: 'green' },
  rejected: { label: 'Rechazada', color: 'red' },
  expired: { label: 'Expirada', color: 'yellow' },
};

// Función para generar números de cotización
export function generateQuotationNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Secuencial aleatorio (en producción se debería usar una secuencia real)
  const sequential = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `COT-${year}${month}-${sequential}`;
}