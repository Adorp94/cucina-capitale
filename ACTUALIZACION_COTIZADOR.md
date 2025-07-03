# Actualización del Sistema de Cotización - Cucina Capitale

## ✅ Cambios Completados

Se ha actualizado completamente el sistema de cotización para implementar la nueva fórmula de cálculo de precios según las especificaciones proporcionadas.

## Tipos de Proyecto Disponibles

El formulario de cotización ahora incluye los **3 tipos de proyecto** requeridos:

| Tipo        | ID Sistema | MP  | Accesorios | GF  | Margen |
|-------------|------------|-----|------------|-----|--------|
| Interno     | 2          | 0%  | 0%         | 15% | 0%     |
| Residencial | 1          | 0%  | 0%         | 30% | 30%    |
| Desarrollo  | 3          | 0%  | 0%         | 15% | 25%    |

### Nueva Fórmula Implementada

**Precio de Venta = (Costo Total MP + Gastos Fijos) ÷ (1 - Margen Definido)**

Donde:
- **Costo Total MP**: Suma de todos los materiales × cantidad (sin margen por ahora)
- **Gastos Fijos (SIF)**: Costo MP × porcentaje según tipo de proyecto
- **Margen Definido**: Porcentaje de margen de venta según tipo de proyecto

## Funcionalidades Implementadas

### 1. ✅ Materia Prima (0% Margen)
- Tableros, chapa cinta, jaladeras, correderas, bisagras
- Patas, clips de patas, ménsulas, tipón, kit de tornillos, empaque
- Sistema preparado para futuros márgenes

### 2. ✅ Gastos Fijos (SIF)
- **Interno**: 15% sobre costo total MP
- **Residencial**: 30% sobre costo total MP  
- **Desarrollo**: 15% sobre costo total MP

### 3. ✅ Accesorios
- Costo directo sin margen adicional
- SIF aplicable solo a accesorios que requieren instalación
- SIF = 0 para accesorios sin instalación

### 4. ✅ Interfaz de Usuario
- **3 tipos de proyecto** disponibles en el formulario
- **Botones de recálculo** individual y masivo
- **Indicadores visuales** de nueva fórmula vs. fórmula antigua
- **Validación** de tipo de proyecto antes de calcular

## Cambios en Base de Datos

### Tablas Creadas
```sql
-- Tabla de márgenes por tipo de proyecto
CREATE TABLE margenes (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL UNIQUE,
  margen_mp NUMERIC(5,4) DEFAULT 0.0000,
  margen_accesorios NUMERIC(5,4) DEFAULT 0.0000,
  gastos_fijos NUMERIC(5,4) NOT NULL,
  margen_venta NUMERIC(5,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de accesorios
CREATE TABLE accesorios_instalacion (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(100),
  requiere_instalacion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Datos Insertados
```sql
-- Configuración de márgenes
INSERT INTO margenes (tipo, margen_mp, margen_accesorios, gastos_fijos, margen_venta) VALUES
('interno', 0.0000, 0.0000, 0.15, 0.0000),
('residencial', 0.0000, 0.0000, 0.30, 0.30),
('desarrollo', 0.0000, 0.0000, 0.15, 0.25);

-- Configuración de accesorios
INSERT INTO accesorios_instalacion (nombre, categoria, requiere_instalacion) VALUES
('bisagras', 'herrajes', true),
('corredera', 'herrajes', true),
('jaladera', 'herrajes', true),
('u_tl', 'herrajes', true),
('patas', 'estructura', false),
('clip_patas', 'estructura', false),
('mensulas', 'estructura', false),
('kit_tornillo', 'herrajes', false),
('cif', 'empaque', false);
```

## Archivos Modificados

### Backend/Lógica
- ✅ **`src/lib/cotizador/pricing.ts`**: Nueva utilidad de cálculo con fórmula actualizada
- ✅ **`src/lib/cotizador/constants.ts`**: Constantes y mapeos actualizados

### Frontend
- ✅ **`src/components/cotizador/cotizacion-form-simplified.tsx`**: 
  - Agregado tipo "Interno" al formulario
  - Nuevas funciones de recálculo
  - Botones de recálculo individual y masivo
  - Interfaz actualizada con indicadores

### Base de Datos
- ✅ **Nueva migración**: `create_margins_and_fixed_costs_tables`
- ✅ **Datos iniciales**: Configuración completa de márgenes y accesorios

## Uso del Sistema Actualizado

### 1. Seleccionar Tipo de Proyecto
El formulario ahora incluye:
- **Interno** (GF: 15%, Margen: 0%)
- **Residencial** (GF: 30%, Margen: 30%)
- **Desarrollo** (GF: 15%, Margen: 25%)

### 2. Nuevos Botones de Recálculo
- **"Recalcular Todos"**: En la cabecera de productos
- **Ícono calculadora**: En cada fila de producto
- **"Recalcular Precios"**: En la sección de materiales

### 3. Indicadores Visuales
- **Información del proyecto**: Muestra GF y margen por tipo
- **Nueva fórmula**: Explicación visible en debug
- **Avisos**: Cuándo usar recálculo tras cambios

## Validación y Testing

### Verificaciones Realizadas
- ✅ **3 tipos de proyecto** disponibles en formulario
- ✅ **Mapeo correcto** de IDs (2=Interno, 1=Residencial, 3=Desarrollo)
- ✅ **Nueva fórmula** implementada y probada
- ✅ **Sistema de recálculo** funcional
- ✅ **Retrocompatibilidad** mantenida
- ✅ **Manejo de errores** implementado

### Casos de Prueba Recomendados
1. **Crear cotización tipo "Interno"** - verificar GF 15%, Margen 0%
2. **Crear cotización tipo "Residencial"** - verificar GF 30%, Margen 30%
3. **Crear cotización tipo "Desarrollo"** - verificar GF 15%, Margen 25%
4. **Cambiar materiales** y usar botón "Recalcular Todos"
5. **Recálculo individual** de productos específicos

## Estado del Sistema

🎯 **COMPLETADO AL 100%** - El sistema ahora incluye:
- ✅ Los 3 tipos de proyecto requeridos
- ✅ Nueva fórmula de cálculo implementada  
- ✅ Interfaz actualizada con funcionalidades de recálculo
- ✅ Base de datos configurada con márgenes correctos
- ✅ Mapeo de tipos de proyecto funcionando correctamente

**El cotizador está listo para producción con la nueva especificación de precios.**

---
*Documentación actualizada: $(date)*  
*Sistema validado con los 3 tipos de proyecto: Interno, Residencial, Desarrollo* 