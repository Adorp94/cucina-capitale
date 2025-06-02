import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Function to create the insumos and materiales tables if they don't exist
 */
export async function createTablesIfNotExist(
  supabase: SupabaseClient<Database>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Checking if tables exist...');
    
    // Check if insumos table exists by attempting to fetch 1 row
    const { error: insumosCheckError } = await supabase
      .from('insumos')
      .select('*')
      .limit(1);

    // If table doesn't exist (error code 42P01), create it
    if (insumosCheckError && insumosCheckError.code === '42P01') {
      console.log('Creating insumos table...');
      
      // Create the insumos table
      const { error: createInsumosError } = await supabase.rpc('create_insumos_table');
      
      if (createInsumosError) {
        console.error('Error creating insumos table:', createInsumosError);
        return {
          success: false,
          error: `Error creating insumos table: ${createInsumosError.message}`
        };
      }
    }

    // Check if materiales table exists by attempting to fetch 1 row
    const { error: materialesCheckError } = await supabase
      .from('materiales')
      .select('id')
      .limit(1);

    // If the table doesn't exist, create it
    if (materialesCheckError && materialesCheckError.code === '42P01') {
      console.log('Creating materiales table...');
      
      // Create the materiales table
      const { error: createMaterialesError } = await supabase.rpc('create_materiales_table');
      
      if (createMaterialesError) {
        console.error('Error creating materiales table:', createMaterialesError);
        return {
          success: false,
          error: `Error creating materiales table: ${createMaterialesError.message}`
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createTablesIfNotExist:', error);
    return {
      success: false,
      error: `Error creating tables: ${(error as Error).message}`
    };
  }
}

/**
 * Function to create SQL functions for creating tables (these will be used via RPC)
 */
export async function createSqlFunctions(
  supabase: SupabaseClient<Database>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create function to create insumos table
    const { error: createInsumosFunctionError } = await supabase.rpc('create_sql_functions', {
      function_name: 'create_insumos_table',
      function_sql: `
        CREATE TABLE IF NOT EXISTS public.insumos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          unit TEXT,
          base_price NUMERIC NOT NULL DEFAULT 0,
          category TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          created_by UUID REFERENCES auth.users(id)
        );
        
        -- Add RLS policies
        ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow all authenticated users to read
        CREATE POLICY "Allow authenticated read access"
          ON public.insumos
          FOR SELECT
          TO authenticated
          USING (true);
        
        -- Create policy to allow authenticated users to insert with their user ID
        CREATE POLICY "Allow authenticated insert access"
          ON public.insumos
          FOR INSERT
          TO authenticated
          WITH CHECK (true);
          
        -- Create policy to allow authenticated users to update rows
        CREATE POLICY "Allow authenticated update access"
          ON public.insumos
          FOR UPDATE
          TO authenticated
          USING (true);
          
        -- Create policy to allow authenticated users to delete rows
        CREATE POLICY "Allow authenticated delete access"
          ON public.insumos
          FOR DELETE
          TO authenticated
          USING (true);
      `
    });

    if (createInsumosFunctionError) {
      console.error('Error creating insumos function:', createInsumosFunctionError);
      return {
        success: false,
        error: `Error creating insumos function: ${createInsumosFunctionError.message}`
      };
    }

    // Create function to create materiales table
    const { error: createMaterialesFunctionError } = await supabase.rpc('create_sql_functions', {
      function_name: 'create_materiales_table',
      function_sql: `
        CREATE TABLE IF NOT EXISTS public.materiales (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          created_by UUID REFERENCES auth.users(id)
        );
        
        -- Add RLS policies
        ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow all authenticated users to read
        CREATE POLICY "Allow authenticated read access"
          ON public.materiales
          FOR SELECT
          TO authenticated
          USING (true);
        
        -- Create policy to allow authenticated users to insert with their user ID
        CREATE POLICY "Allow authenticated insert access"
          ON public.materiales
          FOR INSERT
          TO authenticated
          WITH CHECK (true);
          
        -- Create policy to allow authenticated users to update rows
        CREATE POLICY "Allow authenticated update access"
          ON public.materiales
          FOR UPDATE
          TO authenticated
          USING (true);
          
        -- Create policy to allow authenticated users to delete rows
        CREATE POLICY "Allow authenticated delete access"
          ON public.materiales
          FOR DELETE
          TO authenticated
          USING (true);
      `
    });

    if (createMaterialesFunctionError) {
      console.error('Error creating materiales function:', createMaterialesFunctionError);
      return {
        success: false,
        error: `Error creating materiales function: ${createMaterialesFunctionError.message}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createSqlFunctions:', error);
    return {
      success: false,
      error: `Error creating SQL functions: ${(error as Error).message}`
    };
  }
}

/**
 * Function to initialize database schema and tables if needed
 */
export async function initializeDatabaseSchema(
  supabase: SupabaseClient<Database>
): Promise<{ success: boolean; error?: string }> {
  // First create the SQL functions
  const { success: sqlFunctionsSuccess, error: sqlFunctionsError } = await createSqlFunctions(supabase);
  
  if (!sqlFunctionsSuccess) {
    return { success: false, error: sqlFunctionsError };
  }
  
  // Then create the tables if they don't exist
  return await createTablesIfNotExist(supabase);
} 