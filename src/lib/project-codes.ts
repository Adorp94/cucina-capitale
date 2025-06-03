// Utility functions for project code generation
// Based on the coding system specification provided

export interface ProjectCodeConfig {
  projectType: 'residencial' | 'vertical';
  verticalProject?: 'WN' | 'SY' | string; // For vertical projects
  date: Date;
  consecutiveNumber: number;
  prototipo?: string; // Only for vertical projects (B1, A2, PH, etc.)
}

export interface FurnitureCodeConfig extends ProjectCodeConfig {
  area: string; // CL, DP, LV, VD, PI, LB, MB, ES
  muebleType: string; // ALC, ALT, ALE, etc.
  productionType?: 'A' | 'G'; // A = adicional, G = garantía
}

// Project type mappings
export const PROJECT_TYPES = {
  RESIDENCIAL: 'RE',
  VERTICAL: {
    WEN: 'WN',
    SATORY: 'SY'
  }
} as const;

// Area abbreviations (two letters)
export const AREAS = {
  CLOSET: 'CL',
  DESPENSA: 'DP',
  LAVANDERIA: 'LV',
  VESTIDOR: 'VD',
  PUERTAS_INTERCOMUNICACION: 'PI',
  LIBRERO: 'LB',
  MUEBLE: 'MB',
  ESPECIALIDAD: 'ES'
} as const;

// Furniture type abbreviations (three letters)
export const FURNITURE_TYPES = {
  ALACENA: 'ALC',
  ALACENA_TIPON: 'ALT',
  ALACENA_ESQUINERA: 'ALE',
  ALACENA_ESQUINERA_TIPON: 'AET',
  GABINETE: 'GAB',
  GABINETE_ESQUINERO: 'GAE',
  PARRILLA: 'PAR',
  TARJA: 'TAR',
  DECORATIVO: 'DEC',
  HUACAL: 'HUA',
  LOCKER: 'LOC',
  LOCKER_TIPON: 'LOT',
  CLOSET: 'CLO',
  CAJONERA: 'CAJ',
  CAJON: 'CJN',
  CAJON_CON_VISTA: 'CJV',
  CAJON_INTERNO: 'CJI',
  CAJON_INTERNO_VISTA: 'CIV',
  CAJON_U: 'CJU',
  CAJON_U_CON_VISTA: 'CUV',
  VISTA: 'VIS',
  ENTREPANO: 'ENT',
  ZAPATERO: 'ZAP',
  REPISA_DOBLE_CFIJACION: 'RDC',
  REPISA_TRIPLE_CFIJACION: 'RTC',
  ACCESORIO: 'ACC'
} as const;

// Production types
export const PRODUCTION_TYPES = {
  ORIGINAL: '', // Empty for original orders
  ADICIONAL: 'A',
  GARANTIA: 'G'
} as const;

/**
 * Generates a project code based on the configuration
 * Format: [TIPO]-[FECHA]-[CONSECUTIVO] or [TIPO]-[FECHA]-[CONSECUTIVO]-[PROTOTIPO] for vertical
 */
export function generateProjectCode(config: ProjectCodeConfig): string {
  const { projectType, verticalProject, date, consecutiveNumber, prototipo } = config;
  
  // Get project type prefix
  let typePrefix: string;
  if (projectType === 'residencial') {
    typePrefix = PROJECT_TYPES.RESIDENCIAL;
  } else {
    if (!verticalProject) {
      throw new Error('Vertical project name is required for vertical projects');
    }
    // For vertical projects, use first and last letter if custom name
    if (verticalProject === 'WN' || verticalProject === 'SY') {
      typePrefix = verticalProject;
    } else {
      // Extract first and last letter for custom vertical project names
      const name = verticalProject.toUpperCase();
      typePrefix = name.charAt(0) + name.charAt(name.length - 1);
    }
  }
  
  // Get date segment (last digit of year + two digits of month)
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const dateSegment = `${year.toString().slice(-1)}${month.toString().padStart(2, '0')}`;
  
  // Get consecutive number (3 digits)
  const consecutiveSegment = consecutiveNumber.toString().padStart(3, '0');
  
  // Build base code
  let code = `${typePrefix}-${dateSegment}-${consecutiveSegment}`;
  
  // Add prototype for vertical projects
  if (projectType === 'vertical' && prototipo) {
    code += `-${prototipo}`;
  }
  
  return code;
}

/**
 * Generates a complete furniture piece code
 * Format: [PROJECT_CODE]-[AREA]-[MUEBLE][-PRODUCTION_TYPE]
 */
export function generateFurnitureCode(config: FurnitureCodeConfig): string {
  const { area, muebleType, productionType } = config;
  
  // Generate base project code
  const projectCode = generateProjectCode(config);
  
  // Build furniture code
  let furnitureCode = `${projectCode}-${area}-${muebleType}`;
  
  // Add production type suffix if specified
  if (productionType) {
    furnitureCode += `-${productionType}`;
  }
  
  return furnitureCode;
}

/**
 * Gets the next consecutive number for a given month and project type
 * This should be called from the backend to ensure atomicity
 */
export async function getNextConsecutiveNumber(
  projectType: string,
  verticalProject: string | null,
  date: Date,
  supabaseClient: any
): Promise<number> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  // Build the prefix for searching existing codes
  let typePrefix: string;
  if (projectType === '1') { // Residencial
    typePrefix = PROJECT_TYPES.RESIDENCIAL;
  } else if (projectType === '3') { // Desarrollo (vertical)
    if (!verticalProject) {
      throw new Error('Vertical project name is required for development projects');
    }
    // For now, default to WN, but this should be configurable
    typePrefix = PROJECT_TYPES.VERTICAL.WEN;
  } else {
    throw new Error('Unsupported project type for code generation');
  }
  
  const dateSegment = `${year.toString().slice(-1)}${month.toString().padStart(2, '0')}`;
  const codePrefix = `${typePrefix}-${dateSegment}-`;
  
  // Query existing cotizaciones to find the highest consecutive number for this month
  const { data, error } = await supabaseClient
    .from('cotizaciones')
    .select('project_code')
    .like('project_code', `${codePrefix}%`)
    .order('project_code', { ascending: false })
    .limit(1);
  
  if (error) {
    throw new Error(`Error querying existing project codes: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    return 1; // First project of the month
  }
  
  // Extract the consecutive number from the last project code
  const lastCode = data[0].project_code;
  const parts = lastCode.split('-');
  if (parts.length >= 3) {
    const lastConsecutive = parseInt(parts[2], 10);
    return lastConsecutive + 1;
  }
  
  return 1;
}

/**
 * Parses a project code and returns its components
 */
export function parseProjectCode(code: string): {
  typePrefix: string;
  year: number;
  month: number;
  consecutive: number;
  prototipo?: string;
} {
  const parts = code.split('-');
  if (parts.length < 3) {
    throw new Error('Invalid project code format');
  }
  
  const typePrefix = parts[0];
  const dateSegment = parts[1];
  const consecutive = parseInt(parts[2], 10);
  
  // Parse date segment
  const year = 2020 + parseInt(dateSegment.charAt(0), 10); // Assuming 2020s decade
  const month = parseInt(dateSegment.slice(1), 10);
  
  const result = {
    typePrefix,
    year,
    month,
    consecutive,
  };
  
  // Add prototype if present (for vertical projects)
  if (parts.length >= 4) {
    return { ...result, prototipo: parts[3] };
  }
  
  return result;
}

/**
 * Validates a project code format
 */
export function validateProjectCode(code: string): boolean {
  try {
    parseProjectCode(code);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets area name from abbreviation
 */
export function getAreaName(abbreviation: string): string {
  const areaEntry = Object.entries(AREAS).find(([_, abbrev]) => abbrev === abbreviation);
  return areaEntry ? areaEntry[0].toLowerCase().replace(/_/g, ' ') : abbreviation;
}

/**
 * Gets furniture type name from abbreviation
 */
export function getFurnitureTypeName(abbreviation: string): string {
  const furnitureEntry = Object.entries(FURNITURE_TYPES).find(([_, abbrev]) => abbrev === abbreviation);
  return furnitureEntry ? furnitureEntry[0].toLowerCase().replace(/_/g, ' ') : abbreviation;
} 