-- Add foreign key constraints to connect insumos with materiales
-- This assumes that the mat_huacal, mat_vista, jaladera, corredera, bisagras columns in insumos
-- reference the id_material from the materiales table.

-- First, convert the columns from their current type to bigint to match materiales.id_material
ALTER TABLE public.insumos ALTER COLUMN mat_huacal TYPE bigint USING mat_huacal::bigint;
ALTER TABLE public.insumos ALTER COLUMN mat_vista TYPE bigint USING mat_vista::bigint;
ALTER TABLE public.insumos ALTER COLUMN jaladera TYPE bigint USING jaladera::bigint;
ALTER TABLE public.insumos ALTER COLUMN corredera TYPE bigint USING corredera::bigint;
ALTER TABLE public.insumos ALTER COLUMN bisagras TYPE bigint USING bisagras::bigint;

-- Now add the foreign key constraints
-- Mat Huacal constraint
ALTER TABLE public.insumos
    ADD CONSTRAINT fk_insumos_mat_huacal 
FOREIGN KEY (mat_huacal) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Mat Vista constraint  
ALTER TABLE public.insumos
    ADD CONSTRAINT fk_insumos_mat_vista 
FOREIGN KEY (mat_vista) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Jaladera constraint
ALTER TABLE public.insumos
    ADD CONSTRAINT fk_insumos_jaladera 
FOREIGN KEY (jaladera) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Corredera constraint
ALTER TABLE public.insumos
    ADD CONSTRAINT fk_insumos_corredera 
FOREIGN KEY (corredera) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Bisagras constraint
ALTER TABLE public.insumos
    ADD CONSTRAINT fk_insumos_bisagras 
FOREIGN KEY (bisagras) 
REFERENCES public.materiales(id_material)
ON DELETE SET NULL
ON UPDATE CASCADE; 