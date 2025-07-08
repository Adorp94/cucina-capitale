import { Decimal } from 'decimal.js';
import { createBrowserClient } from '@supabase/ssr';

// Tipos para la nueva estructura de márgenes
export interface MargenConfig {
  id: number;
  tipo: string;
  margen_mp: number;
  margen_accesorios: number;
  gastos_fijos: number;
  margen_venta: number;
}

export interface AccesorioInstalacion {
  id: number;
  nombre: string;
  categoria: string;
  requiere_instalacion: boolean;
}

export interface MaterialData {
  id_material: number;
  nombre: string;
  costo: number;
  tipo: string;
  categoria: string;
}

export interface FurnitureData {
  mat_huacal?: number;
  mat_vista?: number;
  chap_huacal?: number;
  chap_vista?: number;
  jaladera?: number;
  corredera?: number;
  bisagras?: number;
  u_tl?: number; // tip-on largo
  patas?: number;
  clip_patas?: number;
  mensulas?: number;
  kit_tornillo?: number;
  cif?: number;
}

export interface SelectedMaterials {
  matHuacal?: MaterialData;
  matVista?: MaterialData;
  chapHuacal?: MaterialData;
  chapVista?: MaterialData;
  jaladera?: MaterialData;
  corredera?: MaterialData;
  bisagra?: MaterialData;
  tipOnLargo?: MaterialData;
}

export interface PriceBreakdown {
  costoMateriaPrima: Decimal;
  gastosFijos: Decimal;
  precioVenta: Decimal;
  componentes: {
    materiales: Array<{
      nombre: string;
      cantidad: number;
      costoUnitario: number;
      costoTotal: Decimal;
    }>;
    accesorios: Array<{
      nombre: string;
      cantidad: number;
      costoUnitario: number;
      costoTotal: Decimal;
      requiereInstalacion: boolean;
      gastosFijos: Decimal;
    }>;
  };
}

// Mapeo de tipos de proyecto del sistema actual al nuevo sistema de márgenes
const PROJECT_TYPE_MAPPING: Record<string, string> = {
  '1': 'residencial',  // Residencial
  '3': 'desarrollo',   // Desarrollo/Vertical
  '2': 'interno',      // Interno (si existe)
};

// Cache para configuraciones de márgenes
let margenesCache: Record<string, MargenConfig> = {};
let accesoriosInstalacionCache: Record<string, AccesorioInstalacion> = {};

/**
 * Obtiene la configuración de márgenes para un tipo de proyecto
 */
export async function getMargenConfig(projectType: string): Promise<MargenConfig | null> {
  const tipoMargen = PROJECT_TYPE_MAPPING[projectType];
  if (!tipoMargen) return null;

  // Verificar cache primero
  if (margenesCache[tipoMargen]) {
    return margenesCache[tipoMargen];
  }

  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('margenes')
      .select('*')
      .eq('tipo', tipoMargen)
      .single();

    if (error || !data) {
      console.error('Error fetching margin config:', error);
      return null;
    }

    // Guardar en cache
    margenesCache[tipoMargen] = data;
    return data;
  } catch (error) {
    console.error('Error in getMargenConfig:', error);
    return null;
  }
}

/**
 * Obtiene la configuración de instalación para un accesorio
 */
export async function getAccesorioInstalacion(nombre: string): Promise<AccesorioInstalacion | null> {
  // Verificar cache primero
  if (accesoriosInstalacionCache[nombre]) {
    return accesoriosInstalacionCache[nombre];
  }

  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('accesorios_instalacion')
      .select('*')
      .eq('nombre', nombre)
      .single();

    if (error || !data) {
      // Valor por defecto si no se encuentra
      const defaultConfig: AccesorioInstalacion = {
        id: 0,
        nombre,
        categoria: 'unknown',
        requiere_instalacion: false
      };
      accesoriosInstalacionCache[nombre] = defaultConfig;
      return defaultConfig;
    }

    // Guardar en cache
    accesoriosInstalacionCache[nombre] = data;
    return data;
  } catch (error) {
    console.error('Error in getAccesorioInstalacion:', error);
    return null;
  }
}

/**
 * Busca un accesorio en la tabla de accesorios
 */
export async function findAccessory(searchCriteria: { name?: string; category?: string }): Promise<{ costo: number } | null> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase.from('accesorios').select('costo');

    if (searchCriteria.name) {
      query = query.eq('nombre', searchCriteria.name);
    }
    if (searchCriteria.category) {
      query = query.eq('categoria', searchCriteria.category);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    return { costo: parseFloat(data.costo) };
  } catch (error) {
    console.error('Error in findAccessory:', error);
    return null;
  }
}

/**
 * Calcula el precio de un mueble según las nuevas especificaciones
 * 
 * Nueva fórmula:
 * 1. Costo materia prima = suma de todos los materiales × cantidad (sin margen por ahora)
 * 2. Gastos fijos (SIF) = costo materia prima × porcentaje_GF del tipo de proyecto
 * 3. Precio de venta = (costo materia prima + gastos fijos) / (1 - margen definido)
 * 
 * Para accesorios:
 * - Si requiere instalación: aplicar SIF
 * - Si no requiere instalación: SIF = 0
 * - Precio = (costo accesorio + SIF, si aplica) / (1 - margen definido)
 */
export async function calculateFurniturePrice(
  furnitureData: FurnitureData,
  selectedMaterials: SelectedMaterials,
  projectType: string
): Promise<PriceBreakdown | null> {
  console.log('🔄 Calculating furniture price with new formula...');
  console.log('Project type:', projectType);
  console.log('Furniture data:', furnitureData);
  console.log('Selected materials:', selectedMaterials);

  // Obtener configuración de márgenes
  const margenConfig = await getMargenConfig(projectType);
  if (!margenConfig) {
    console.error('❌ No margin configuration found for project type:', projectType);
    return null;
  }

  console.log('💰 Margin config:', margenConfig);

  let costoMateriaPrima = new Decimal(0);
  const componentes = {
    materiales: [] as any[],
    accesorios: [] as any[]
  };

  // 📋 PASO 1: Calcular costo de materia prima (materiales base)
  console.log('\n📋 PASO 1: Calculando costo de materia prima...');

  // Materiales seleccionables
  const materialCalculations = [
    { key: 'mat_huacal', material: selectedMaterials.matHuacal, quantity: furnitureData.mat_huacal },
    { key: 'mat_vista', material: selectedMaterials.matVista, quantity: furnitureData.mat_vista },
    { key: 'chap_huacal', material: selectedMaterials.chapHuacal, quantity: furnitureData.chap_huacal },
    { key: 'chap_vista', material: selectedMaterials.chapVista, quantity: furnitureData.chap_vista },
    { key: 'jaladera', material: selectedMaterials.jaladera, quantity: furnitureData.jaladera },
    { key: 'corredera', material: selectedMaterials.corredera, quantity: furnitureData.corredera },
    { key: 'bisagras', material: selectedMaterials.bisagra, quantity: furnitureData.bisagras },
    { key: 'u_tl', material: selectedMaterials.tipOnLargo, quantity: furnitureData.u_tl }
  ];

  for (const calc of materialCalculations) {
    if (calc.quantity && calc.quantity > 0 && calc.material) {
      const costoComponente = new Decimal(calc.quantity).mul(calc.material.costo);
      
      // Sin margen de materia prima (margen_mp = 0% según especificaciones)
      const costoConMargen = costoComponente.mul(new Decimal(1).add(margenConfig.margen_mp));
      
      costoMateriaPrima = costoMateriaPrima.add(costoConMargen);
      
      componentes.materiales.push({
        nombre: calc.material.nombre,
        cantidad: calc.quantity,
        costoUnitario: calc.material.costo,
        costoTotal: costoConMargen
      });

      console.log(`  ✅ ${calc.key}: ${calc.quantity} × $${calc.material.costo} = $${costoComponente.toFixed(2)} (margen MP: ${(margenConfig.margen_mp * 100).toFixed(1)}%)`);
    }
  }

  console.log(`💰 Costo total materia prima: $${costoMateriaPrima.toFixed(2)}`);

  // 🔧 PASO 2: Procesar accesorios
  console.log('\n🔧 PASO 2: Procesando accesorios...');

  const accesoriosCalculations = [
    { key: 'patas', quantity: furnitureData.patas },
    { key: 'clip_patas', quantity: furnitureData.clip_patas },
    { key: 'mensulas', quantity: furnitureData.mensulas },
    { key: 'kit_tornillo', quantity: furnitureData.kit_tornillo },
    { key: 'cif', quantity: furnitureData.cif }
  ];

  let costoAccesorios = new Decimal(0);

  for (const accCalc of accesoriosCalculations) {
    if (accCalc.quantity && accCalc.quantity > 0) {
      // Buscar costo del accesorio
      const accesorio = await findAccessory({ name: accCalc.key });
      
      // Costos por defecto como fallback
      const defaultCosts: Record<string, number> = {
        patas: 10,
        clip_patas: 2,
        mensulas: 0.9,
        kit_tornillo: 30,
        cif: 100
      };
      
      const costoUnitario = accesorio?.costo || defaultCosts[accCalc.key] || 0;
      
      // Obtener configuración de instalación
      const instalacionConfig = await getAccesorioInstalacion(accCalc.key);
      const requiereInstalacion = instalacionConfig?.requiere_instalacion || false;
      
      // Costo base del accesorio (sin margen por ahora)
      const costoBase = new Decimal(accCalc.quantity).mul(costoUnitario);
      const costoConMargenAcc = costoBase.mul(new Decimal(1).add(margenConfig.margen_accesorios));
      
      // Calcular SIF solo si requiere instalación
      let gastosFijos = new Decimal(0);
      if (requiereInstalacion) {
        gastosFijos = costoConMargenAcc.mul(margenConfig.gastos_fijos);
        console.log(`  🔧 ${accCalc.key}: requiere instalación, aplicando SIF del ${(margenConfig.gastos_fijos * 100).toFixed(1)}%`);
      } else {
        console.log(`  📦 ${accCalc.key}: no requiere instalación, SIF = 0%`);
      }
      
      costoAccesorios = costoAccesorios.add(costoConMargenAcc).add(gastosFijos);
      
      componentes.accesorios.push({
        nombre: accCalc.key,
        cantidad: accCalc.quantity,
        costoUnitario,
        costoTotal: costoConMargenAcc,
        requiereInstalacion,
        gastosFijos
      });

      console.log(`  ✅ ${accCalc.key}: ${accCalc.quantity} × $${costoUnitario} = $${costoBase.toFixed(2)} (SIF: $${gastosFijos.toFixed(2)})`);
    }
  }

  console.log(`🔧 Costo total accesorios (con SIF): $${costoAccesorios.toFixed(2)}`);

  // 📊 PASO 3: Calcular gastos fijos (SIF) sobre materia prima
  console.log('\n📊 PASO 3: Calculando gastos fijos (SIF)...');
  const gastosFijos = costoMateriaPrima.mul(margenConfig.gastos_fijos);
  console.log(`💼 SIF (${(margenConfig.gastos_fijos * 100).toFixed(1)}% sobre materia prima): $${gastosFijos.toFixed(2)}`);

  // 💰 PASO 4: Calcular precio de venta final
  console.log('\n💰 PASO 4: Calculando precio de venta...');
  const costoTotal = costoMateriaPrima.add(gastosFijos).add(costoAccesorios);
  const factorMargen = new Decimal(1).sub(margenConfig.margen_venta);
  const precioVenta = costoTotal.div(factorMargen);

  console.log(`📋 Costo total: $${costoTotal.toFixed(2)}`);
  console.log(`📈 Factor margen (1 - ${(margenConfig.margen_venta * 100).toFixed(1)}%): ${factorMargen.toFixed(4)}`);
  console.log(`🎯 Precio de venta final: $${precioVenta.toFixed(2)}`);

  const breakdown: PriceBreakdown = {
    costoMateriaPrima,
    gastosFijos,
    precioVenta,
    componentes
  };

  console.log('\n✅ Cálculo completado exitosamente');
  return breakdown;
}

/**
 * Invalida el cache de configuraciones (útil para desarrollo)
 */
export function clearCache(): void {
  margenesCache = {};
  accesoriosInstalacionCache = {};
  console.log('�� Cache cleared');
} 