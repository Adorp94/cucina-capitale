-- Migration: Add project_code column to cotizaciones table
-- This field will store the unique project code generated for each quotation

-- Add the project_code column
ALTER TABLE cotizaciones 
ADD COLUMN project_code VARCHAR(50) UNIQUE;

-- Add an index for faster lookups
CREATE INDEX idx_cotizaciones_project_code ON cotizaciones(project_code);

-- Add a comment explaining the field
COMMENT ON COLUMN cotizaciones.project_code IS 'Unique project code following format: [TYPE]-[DATE]-[CONSECUTIVE]-[PROTOTYPE] (e.g., RE-505-001 or WN-505-001-B1)';

-- Note: The project_code will be generated and populated when creating new cotizaciones
-- Existing cotizaciones will have NULL project_code initially 