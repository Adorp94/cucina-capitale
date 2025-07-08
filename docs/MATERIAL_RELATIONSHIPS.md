# Material Relationships System - Technical Documentation

## 📋 Overview

The Material Relationships system manages compatibility between different materials in the Cucina Capitale project. This system ensures that only compatible materials are used together in kitchen designs.

**Primary Use Case**: Define which `cubrecantos` are compatible with specific `tableros`.

---

## 🏗️ Database Structure

### Table: `material_relationships`

```sql
CREATE TABLE material_relationships (
  id SERIAL PRIMARY KEY,
  material_id_primary INTEGER REFERENCES materiales(id_material) ON DELETE CASCADE,
  material_id_secondary INTEGER REFERENCES materiales(id_material) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'tablero_cubrecanto',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(material_id_primary, material_id_secondary, relationship_type)
);
```

### Indexes
```sql
CREATE INDEX idx_material_relationships_primary ON material_relationships(material_id_primary);
CREATE INDEX idx_material_relationships_secondary ON material_relationships(material_id_secondary);
CREATE INDEX idx_material_relationships_type ON material_relationships(relationship_type);
```

---

## 🔧 Helper Functions

### Bulk Insert Function
```sql
CREATE OR REPLACE FUNCTION insert_material_relationship_by_names(
  tablero_name TEXT,
  cubrecanto_name TEXT,
  rel_type TEXT DEFAULT 'tablero_cubrecanto'
) RETURNS TABLE(
  relationship_id INTEGER,
  primary_id INTEGER,
  secondary_id INTEGER,
  primary_name TEXT,
  secondary_name TEXT
)
```

**Usage Example**:
```sql
SELECT * FROM insert_material_relationship_by_names(
  'Finsa MDP 12mm GRIS RIOJA',
  'Merino Alto Brillo 22 x 0.80mm SOLAR WHITE (BLANCO)'
);
```

---

## 📊 Data Import Methods

### Method 1: CSV with Material Names (Recommended)

**CSV Format**:
```csv
tablero_name,cubrecanto_name
"Finsa MDP 12mm GRIS RIOJA","Diseños Maderas 19 x 100mm Rioja"
"Finsa MDP 12mm NEGRO","Sólidos Básicos 19 x 100mm Negro"
"Finsa MDP 12mm NATURAL GREY","Color 22 x 100mm"
```

**Import SQL**:
```sql
-- After uploading CSV to temp table
INSERT INTO material_relationships (material_id_primary, material_id_secondary, relationship_type)
SELECT 
  t.id_material as material_id_primary,
  c.id_material as material_id_secondary,
  'tablero_cubrecanto' as relationship_type
FROM temp_csv_data csv
JOIN materiales t ON t.nombre = csv.tablero_name AND t.tipo = 'Tableros'
JOIN materiales c ON c.nombre = csv.cubrecanto_name AND c.tipo = 'Cubrecantos'
ON CONFLICT (material_id_primary, material_id_secondary, relationship_type) DO NOTHING;
```

### Method 2: Direct ID Import

**CSV Format**:
```csv
material_id_primary,material_id_secondary,relationship_type
1711,545,tablero_cubrecanto
1712,546,tablero_cubrecanto
```

### Method 3: Using Helper Function

```sql
-- Bulk insert using function
DO $$
DECLARE
    relationships TEXT[][] := ARRAY[
        ['Finsa MDP 12mm GRIS RIOJA', 'Merino Alto Brillo 22 x 0.80mm SOLAR WHITE (BLANCO)'],
        ['Finsa MDP 18mm BLANCO', 'Color 22 x 100mm BLANCO'],
        ['Masisa MDP 15mm NATURAL', 'Diseños Maderas 19 x 100mm Natural']
    ];
    rel TEXT[];
BEGIN
    FOREACH rel SLICE 1 IN ARRAY relationships
    LOOP
        PERFORM insert_material_relationship_by_names(rel[1], rel[2]);
    END LOOP;
END $$;
```

---

## 🔍 Query Examples

### Find Compatible Cubrecantos for a Tablero

```sql
-- By Tablero Name
SELECT c.nombre, c.costo, c.categoria
FROM materiales c
JOIN material_relationships mr ON c.id_material = mr.material_id_secondary
JOIN materiales t ON t.id_material = mr.material_id_primary
WHERE t.nombre = 'Finsa MDP 12mm GRIS RIOJA'
AND mr.relationship_type = 'tablero_cubrecanto';

-- By Tablero ID
SELECT c.nombre, c.costo, c.categoria
FROM materiales c
JOIN material_relationships mr ON c.id_material = mr.material_id_secondary
WHERE mr.material_id_primary = 1711
AND mr.relationship_type = 'tablero_cubrecanto';
```

### Find All Relationships for Audit

```sql
SELECT 
  t.nombre as tablero,
  c.nombre as cubrecanto,
  mr.relationship_type,
  mr.created_at
FROM material_relationships mr
JOIN materiales t ON t.id_material = mr.material_id_primary
JOIN materiales c ON c.id_material = mr.material_id_secondary
ORDER BY mr.created_at DESC;
```

### Relationship Statistics

```sql
-- Count relationships by type
SELECT relationship_type, COUNT(*) as total_relationships
FROM material_relationships
GROUP BY relationship_type;

-- Materials without relationships
SELECT m.nombre, m.tipo
FROM materiales m
LEFT JOIN material_relationships mr1 ON m.id_material = mr1.material_id_primary
LEFT JOIN material_relationships mr2 ON m.id_material = mr2.material_id_secondary
WHERE mr1.id IS NULL AND mr2.id IS NULL
AND m.tipo IN ('Tableros', 'Cubrecantos');
```

---

## 🎯 UI Integration

### Material Selection Flow

1. **Tablero Selection**: User selects a tablero from materials list
2. **Compatible Cubrecantos**: System filters cubrecantos based on relationships
3. **Validation**: Prevents selection of incompatible materials
4. **Cost Calculation**: Uses both material costs in total

### Frontend Implementation Pattern

```typescript
// Fetch compatible cubrecantos for selected tablero
const getCompatibleCubrecantos = async (tableroId: number) => {
  const { data, error } = await supabase
    .from('materiales')
    .select(`
      id_material,
      nombre,
      costo,
      categoria,
      material_relationships!material_id_secondary(
        material_id_primary
      )
    `)
    .eq('tipo', 'Cubrecantos')
    .eq('material_relationships.material_id_primary', tableroId)
    .eq('material_relationships.relationship_type', 'tablero_cubrecanto');
    
  return data;
};
```

---

## 🔮 Future Relationship Types

### Planned Relationships

1. **`bisagra_puerta`**: Bisagra compatibility with door types
2. **`corredera_cajon`**: Corredera compatibility with drawer sizes
3. **`jaladera_style`**: Jaladera style compatibility
4. **`tablero_thickness`**: Thickness-based compatibility

### Schema Extension

```sql
-- Future relationship types
ALTER TABLE material_relationships 
ADD COLUMN compatibility_score INTEGER CHECK (compatibility_score BETWEEN 1 AND 10);

ALTER TABLE material_relationships 
ADD COLUMN min_quantity INTEGER DEFAULT 1;

ALTER TABLE material_relationships 
ADD COLUMN max_quantity INTEGER;
```

---

## 🛠️ Maintenance Tasks

### Data Validation

```sql
-- Find orphaned relationships (materials that no longer exist)
SELECT mr.id, mr.material_id_primary, mr.material_id_secondary
FROM material_relationships mr
LEFT JOIN materiales m1 ON mr.material_id_primary = m1.id_material
LEFT JOIN materiales m2 ON mr.material_id_secondary = m2.id_material
WHERE m1.id_material IS NULL OR m2.id_material IS NULL;
```

### Performance Monitoring

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'material_relationships';
```

### Cleanup Operations

```sql
-- Remove duplicate relationships (keep newest)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY material_id_primary, material_id_secondary, relationship_type 
    ORDER BY created_at DESC
  ) as rn
  FROM material_relationships
)
DELETE FROM material_relationships 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

---

## 📈 Usage Statistics

Current implementation:
- **Total Relationships**: To be populated after CSV import
- **Relationship Types**: 1 (`tablero_cubrecanto`)
- **Coverage**: Target 80%+ of tableros with at least one compatible cubrecanto

---

## 🚨 Important Notes

1. **Unique Constraint**: Prevents duplicate relationships
2. **Cascade Deletes**: Deleting a material removes all its relationships
3. **Performance**: Indexed for fast lookups
4. **Bidirectional**: Relationships are directional (primary → secondary)
5. **Validation**: UI should enforce compatibility rules

---

*This document should be updated when new relationship types are added or the schema is modified.* 