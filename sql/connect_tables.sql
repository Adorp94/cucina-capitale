-- Add foreign key constraints to connect inventario with materiales
-- This assumes that the mat_huacal, mat_vista, jaladera, corredera, bisagras columns in inventario
-- reference the id_material in materiales table

-- First, ensure all columns are of the same type
ALTER TABLE public.inventario ALTER COLUMN mat_huacal TYPE bigint USING mat_huacal::bigint;
ALTER TABLE public.inventario ALTER COLUMN mat_vista TYPE bigint USING mat_vista::bigint;
ALTER TABLE public.inventario ALTER COLUMN jaladera TYPE bigint USING jaladera::bigint;
ALTER TABLE public.inventario ALTER COLUMN corredera TYPE bigint USING corredera::bigint;
ALTER TABLE public.inventario ALTER COLUMN bisagras TYPE bigint USING bisagras::bigint;

-- Add foreign key constraints
-- Material Huacal
ALTER TABLE public.inventario 
ADD CONSTRAINT fk_mat_huacal
FOREIGN KEY (mat_huacal) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Material Vista
ALTER TABLE public.inventario 
ADD CONSTRAINT fk_mat_vista
FOREIGN KEY (mat_vista) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Jaladera
ALTER TABLE public.inventario 
ADD CONSTRAINT fk_jaladera
FOREIGN KEY (jaladera) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Corredera
ALTER TABLE public.inventario 
ADD CONSTRAINT fk_corredera
FOREIGN KEY (corredera) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Bisagras
ALTER TABLE public.inventario 
ADD CONSTRAINT fk_bisagras
FOREIGN KEY (bisagras) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE; 