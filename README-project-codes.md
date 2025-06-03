# Sistema de Códigos de Proyecto - Cucina Capitale

## Descripción General

Este sistema genera códigos únicos para proyectos y productos individuales siguiendo un formato estandardizado que permite identificar rápidamente el tipo de proyecto, fecha, área y tipo de mueble.

## Estructura del Sistema

### 1. Códigos de Proyecto

#### Formato Base
```
[TIPO]-[FECHA]-[CONSECUTIVO]-[PROTOTIPO]
```

#### Tipos de Proyecto

**Proyectos Residenciales:**
- Formato: `RE-[FECHA]-[CONSECUTIVO]`
- Ejemplo: `RE-505-001`

**Proyectos Verticales (Desarrollos):**
- Formato: `[VERTICAL]-[FECHA]-[CONSECUTIVO]-[PROTOTIPO]`
- Ejemplos: 
  - `WN-505-001-B1` (Wen)
  - `SY-505-001-A2` (Satory)

#### Componentes del Código

- **TIPO**: 
  - `RE` para residencial
  - `WN`, `SY`, etc. para proyectos verticales
- **FECHA**: `[Y][MM]` donde Y = último dígito del año, MM = mes
  - Ejemplo: `505` = Mayo 2025
- **CONSECUTIVO**: Número secuencial de 3 dígitos dentro del mes
- **PROTOTIPO**: Solo para verticales (B1, A2, PH, etc.)

### 2. Códigos de Productos Individuales

#### Formato
```
[CODIGO_PROYECTO]-[AREA]-[MUEBLE][-TIPO_PRODUCCION]
```

#### Ejemplos Completos
- `RE-505-001-CL-ALC` (Alacena original en closet)
- `WN-505-001-B1-CL-ALC-A` (Alacena adicional en closet)
- `RE-505-002-DP-GAB-G` (Gabinete de garantía en despensa)

## Áreas Disponibles

| Código | Área |
|--------|------|
| CL | Closet |
| DP | Despensa |
| LV | Lavandería |
| VD | Vestidor |
| PI | Pisos |
| LB | Librero |
| MB | Mueble de baño |
| ES | Especialidad |

## Tipos de Muebles

| Código | Tipo de Mueble |
|--------|----------------|
| ALC | Alacena |
| ALT | Alacena TipOn |
| ALE | Alacena Esquinera |
| AET | Alacena Esquinera TipOn |
| GAB | Gabinete |
| GAE | Gabinete Esquinero |
| CJN | Cajón |
| CJV | Cajón con Vista |
| CAJ | Cajonera |
| CJI | Cajón Interno |
| CIV | Cajón Interno Vista |
| CJU | Cajón U |
| CUV | Cajón U con Vista |
| CLO | Closet |
| LOC | Locker |
| LOT | Locker TipOn |
| PAR | Parrilla |
| TAR | Tarja |
| DEC | Decorativo |
| HUA | Huacal |
| ENT | Entrepaño |
| VIS | Vista |
| ZAP | Zapatero |
| RDC | Repisa Doble C/Fijación |
| RTC | Repisa Triple C/Fijación |
| ACC | Accesorio |

## Tipos de Producción

- **Original** (sin sufijo): Producto original del proyecto
- **A**: Adicional - Producto agregado después del proyecto original
- **G**: Garantía - Producto de reemplazo por garantía

## Implementación Técnica

### Archivos Principales

1. **`src/lib/project-codes.ts`**
   - Interfaces y constantes
   - Funciones de generación y parsing
   - Validación de códigos

2. **`src/app/api/project-codes/generate/route.ts`**
   - API endpoint para generación de códigos
   - Lógica de números consecutivos únicos
   - Integración con base de datos

3. **`src/components/cotizador/cotizacion-form-simplified.tsx`**
   - UI para selección de áreas y tipos de muebles
   - Preview en tiempo real de códigos
   - Integración con generación de códigos

### Funciones Principales

```typescript
// Generar código de proyecto
generateProjectCode(config: ProjectCodeConfig): string

// Generar código de mueble individual
generateFurnitureCode(config: FurnitureCodeConfig): string

// Parsear código existente
parseProjectCode(code: string): ParsedProjectCode

// Validar formato de código
validateProjectCode(code: string): boolean

// Obtener próximo número consecutivo
getNextConsecutiveNumber(year: number, month: number): Promise<number>
```

### Base de Datos

#### Tabla: `cotizaciones`
- Columna `project_code`: VARCHAR(50) UNIQUE
- Índice para performance en búsquedas

#### Migración SQL
```sql
-- Agregar columna project_code a cotizaciones
ALTER TABLE cotizaciones ADD COLUMN project_code VARCHAR(50) UNIQUE;

-- Crear índice para performance
CREATE INDEX idx_cotizaciones_project_code ON cotizaciones(project_code);

-- Comentarios explicativos
COMMENT ON COLUMN cotizaciones.project_code IS 'Código único del proyecto generado automáticamente';
```

## Uso en la Aplicación

### 1. Creación de Cotización

Al crear una nueva cotización:
1. Se selecciona el tipo de proyecto (Residencial/Desarrollo)
2. Para desarrollos, se especifica el prototipo
3. Se genera automáticamente el código del proyecto
4. Cada producto recibe un código individual basado en área y tipo

### 2. Vista de Códigos

La interfaz muestra:
- **Código del proyecto** en la sección de resumen
- **Códigos individuales** para cada producto en la tabla
- **Preview en tiempo real** mientras se edita

### 3. Tipos de Orden

- **Original**: Primera vez que se produce el mueble
- **Adicional**: Muebles extra agregados al proyecto
- **Garantía**: Reemplazos por defectos o garantía

## Ejemplos de Uso

### Proyecto Residencial
```
Proyecto: Remodelación Cocina García
Código: RE-505-001
Productos:
- RE-505-001-CL-ALC (Alacena en closet)
- RE-505-001-CL-GAB (Gabinete en closet)
- RE-505-001-DP-ENT (Entrepaño en despensa)
```

### Proyecto Vertical
```
Proyecto: Torre Wen - Prototipo B1
Código: WN-505-001-B1
Productos:
- WN-505-001-B1-CL-ALC (Alacena original)
- WN-505-001-B1-CL-ALC-A (Alacena adicional)
- WN-505-001-B1-LV-GAB-G (Gabinete garantía en lavandería)
```

## Beneficios del Sistema

1. **Trazabilidad Completa**: Cada producto se puede rastrear hasta su proyecto origen
2. **Identificación Rápida**: El código revela tipo, fecha, área y propósito
3. **Gestión de Órdenes**: Separación clara entre original, adicional y garantía
4. **Consistencia**: Formato estandardizado en toda la organización
5. **Escalabilidad**: Soporte para múltiples tipos de proyectos y productos

## Mantenimiento

### Agregar Nuevas Áreas
1. Actualizar `AREAS` en `src/lib/project-codes.ts`
2. Agregar mapeo en `getDefaultAreaForCategory()`

### Agregar Nuevos Tipos de Muebles
1. Actualizar `FURNITURE_TYPES` en `src/lib/project-codes.ts`
2. Agregar mapeo en `getDefaultFurnitureTypeForCategory()`

### Agregar Nuevos Proyectos Verticales
1. Actualizar `PROJECT_TYPES` constante
2. Modificar lógica en `generateProjectCode()`

## Consideraciones Futuras

1. **Reportes por Código**: Generar reportes filtrados por patrones de código
2. **Búsqueda Avanzada**: Búsqueda por componentes de código
3. **Validación Avanzada**: Reglas de negocio específicas por tipo
4. **Integración ERP**: Exportación de códigos a sistemas externos
5. **Códigos QR**: Generación de códigos QR para productos físicos 