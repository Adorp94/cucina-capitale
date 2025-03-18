import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createSqlFunctions() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
  console.log('Service Role Key exists:', !!supabaseServiceKey);
  
  // Check if environment variables are available
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Required environment variables are missing:');
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('Creating Supabase client with SERVICE ROLE key...');
  
  // Create Supabase client with service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Supabase client created!');

  try {
    // Create SQL function to disable RLS on inventario
    console.log('\nCreating SQL function to disable RLS on inventario...');
    
    // Define the SQL function for inventario
    const inventarioFunctionSQL = `
      -- Function to disable RLS on inventario table
      CREATE OR REPLACE FUNCTION public.disable_rls_inventario()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Disable RLS on inventario table
        ALTER TABLE public.inventario DISABLE ROW LEVEL SECURITY;
      END;
      $$;

      -- Grant execute permission to the function for authenticated and anon roles
      GRANT EXECUTE ON FUNCTION public.disable_rls_inventario() TO authenticated, anon;
    `;
    
    // Execute the SQL to create the function
    const { error: inventarioFunctionError } = await supabase.rpc('pg_query', { 
      query: inventarioFunctionSQL 
    });
    
    if (inventarioFunctionError) {
      console.error('Error creating inventario function:', inventarioFunctionError);
      
      // Try a more direct approach
      console.log('Trying direct SQL execution...');
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'resolution=ignore-duplicates,params=single-object'
          },
          body: JSON.stringify({
            query: inventarioFunctionSQL
          })
        });
        
        const result = await response.text();
        console.log('Direct SQL result:', result || 'No response text');
      } catch (e) {
        console.error('Error with direct SQL execution:', e);
      }
    } else {
      console.log('Successfully created SQL function for inventario');
    }
    
    // Create SQL function to disable RLS on materiales
    console.log('\nCreating SQL function to disable RLS on materiales...');
    
    // Define the SQL function for materiales
    const materialesFunctionSQL = `
      -- Function to disable RLS on materiales table
      CREATE OR REPLACE FUNCTION public.disable_rls_materiales()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Disable RLS on materiales table
        ALTER TABLE public.materiales DISABLE ROW LEVEL SECURITY;
      END;
      $$;

      -- Grant execute permission to the function for authenticated and anon roles
      GRANT EXECUTE ON FUNCTION public.disable_rls_materiales() TO authenticated, anon;
    `;
    
    // Execute the SQL to create the function
    const { error: materialesFunctionError } = await supabase.rpc('pg_query', { 
      query: materialesFunctionSQL 
    });
    
    if (materialesFunctionError) {
      console.error('Error creating materiales function:', materialesFunctionError);
      
      // Try a more direct approach
      console.log('Trying direct SQL execution...');
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'resolution=ignore-duplicates,params=single-object'
          },
          body: JSON.stringify({
            query: materialesFunctionSQL
          })
        });
        
        const result = await response.text();
        console.log('Direct SQL result:', result || 'No response text');
      } catch (e) {
        console.error('Error with direct SQL execution:', e);
      }
    } else {
      console.log('Successfully created SQL function for materiales');
    }
    
  } catch (error) {
    console.error('Error creating SQL functions:', error);
  }

  console.log('\nScript execution completed.');
}

// Execute the function
createSqlFunctions(); 