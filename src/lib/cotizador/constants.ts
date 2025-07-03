import { CotizadorConfig } from '@/types/cotizacion';

// Configuración predeterminada del cotizador
export const DEFAULT_COTIZADOR_CONFIG: CotizadorConfig = {
  taxRate: 16, // IVA en México (16%)
  defaultTerms: `
1. Los precios están sujetos a cambios sin previo aviso.
2. Esta cotización tiene una validez de 15 días.
3. Los tiempos de entrega se confirmarán al momento de la orden.
4. Se requiere un anticipo del 70% para iniciar el proyecto.
5. El precio no incluye instalación, a menos que se indique expresamente.
  `.trim(),
  validityDays: 15,
  companyInfo: {
    name: 'GRUPO UCMV S.A. de C.V.',
    logo: '/logo.png',
    address: 'Av. Principal #123, Col. Centro, Ciudad de México, CP 01000',
    phone: '+52 55 1234 5678',
    email: 'contacto@grupoucmv.com',
    website: 'www.grupoucmv.com',
    rfc: 'UCM123456ABC',
  },
};

// Mapeo de tipos de proyecto del sistema actual al nuevo sistema de márgenes
export const PROJECT_TYPE_MARGIN_MAPPING: Record<string, string> = {
  '1': 'residencial',  // Residencial
  '3': 'desarrollo',   // Desarrollo/Vertical  
  '2': 'interno',      // Interno (si existe)
};

// Configuración de márgenes por defecto para fallback
// Estos valores coinciden con los insertados en la base de datos
export const DEFAULT_MARGIN_CONFIG = {
  interno: {
    margen_mp: 0.0000,      // 0% - Materia prima sin margen
    margen_accesorios: 0.0000,  // 0% - Accesorios sin margen
    gastos_fijos: 0.15,     // 15% - Gastos fijos (SIF)
    margen_venta: 0.0000,   // 0% - Sin margen de venta
  },
  residencial: {
    margen_mp: 0.0000,      // 0% - Materia prima sin margen
    margen_accesorios: 0.0000,  // 0% - Accesorios sin margen
    gastos_fijos: 0.30,     // 30% - Gastos fijos (SIF)
    margen_venta: 0.30,     // 30% - Margen de venta
  },
  desarrollo: {
    margen_mp: 0.0000,      // 0% - Materia prima sin margen
    margen_accesorios: 0.0000,  // 0% - Accesorios sin margen
    gastos_fijos: 0.15,     // 15% - Gastos fijos (SIF)
    margen_venta: 0.25,     // 25% - Margen de venta
  }
};

// Configuración de accesorios que requieren instalación
export const ACCESSORIES_INSTALLATION_CONFIG = {
  // Accesorios que requieren instalación (SIF aplicable)
  requires_installation: [
    'bisagras',
    'pistones', 
    'corredera',
    'jaladera',
    'tipOn',
    'u_tl', // tip-on largo
  ],
  
  // Accesorios que NO requieren instalación (SIF = 0)
  no_installation: [
    'clip_patas',
    'patas',
    'mensulas', 
    'kit_tornillo',
    'cif',
    'porta_garrafones',
    'accesorios_cubiertos',
  ]
};

// Costos por defecto para accesorios (fallback si no se encuentran en la tabla)
export const DEFAULT_ACCESSORY_COSTS = {
  patas: 10,
  clip_patas: 2,
  mensulas: 0.9,
  kit_tornillo: 30,
  cif: 100,
  bisagras: 15,
  corredera: 25,
  jaladera: 50,
};

// Categorías de productos
export const PRODUCT_CATEGORIES = [
  'Cocina',
  'Vestidor',
  'Baño',
  'Sala',
  'Comedor',
  'Recámara',
  'Oficina',
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