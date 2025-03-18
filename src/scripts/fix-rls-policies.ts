import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixRlsPolicies() {
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
    // First, let's check if RLS is enabled on our tables
    console.log('\nChecking RLS status for tables:');
    
    // Check inventario table RLS status
    const { data: inventarioRls, error: inventarioRlsError } = await supabase
      .rpc('check_rls', { table_name: 'inventario' });
      
    if (inventarioRlsError) {
      console.error('Error checking RLS for inventario:', inventarioRlsError);
      console.log('Trying alternative approach...');
      
      // Run an SQL query to check if RLS is enabled
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .in('tablename', ['inventario', 'materiales'])
        .eq('schemaname', 'public');
        
      if (tablesError) {
        console.error('Error querying pg_tables:', tablesError);
      } else {
        console.log('Tables RLS status:', tablesData);
      }
    } else {
      console.log('Inventario RLS status:', inventarioRls);
    }

    // Direct SQL approach to check and create policies
    console.log('\nCreating/updating RLS policies...');
    
    // For inventario table - create a policy to allow anon select
    const { error: inventarioPolicyError } = await supabase.rpc('execute_sql', {
      sql: `
        -- First enable RLS on the table if it's not already enabled
        ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

        -- Drop the policy if it exists
        DROP POLICY IF EXISTS "Allow anon select" ON public.inventario;
        
        -- Create a policy to allow anonymous users to select
        CREATE POLICY "Allow anon select" ON public.inventario
          FOR SELECT
          TO anon
          USING (true);
      `
    });
    
    if (inventarioPolicyError) {
      console.error('Error setting inventario policy:', inventarioPolicyError);
      
      // Try a more direct approach with separate statements
      console.log('Trying alternative approach with separate statements...');
      
      try {
        // First enable RLS
        await supabase.rpc('execute_sql', {
          sql: `ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;`
        });
        console.log('RLS enabled on inventario table');
        
        // Try to drop existing policy (might fail if it doesn't exist)
        try {
          await supabase.rpc('execute_sql', {
            sql: `DROP POLICY IF EXISTS "Allow anon select" ON public.inventario;`
          });
          console.log('Dropped existing policy on inventario');
        } catch (e) {
          console.log('No existing policy to drop on inventario');
        }
        
        // Create the policy
        await supabase.rpc('execute_sql', {
          sql: `
            CREATE POLICY "Allow anon select" ON public.inventario
              FOR SELECT
              TO anon
              USING (true);
          `
        });
        console.log('Created policy on inventario table');
      } catch (e) {
        console.error('Error with separate statements approach:', e);
      }
    } else {
      console.log('Successfully set inventario policy');
    }
    
    // For materiales table - create a policy to allow anon select
    const { error: materialesPolicyError } = await supabase.rpc('execute_sql', {
      sql: `
        -- First enable RLS on the table if it's not already enabled
        ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;

        -- Drop the policy if it exists
        DROP POLICY IF EXISTS "Allow anon select" ON public.materiales;
        
        -- Create a policy to allow anonymous users to select
        CREATE POLICY "Allow anon select" ON public.materiales
          FOR SELECT
          TO anon
          USING (true);
      `
    });
    
    if (materialesPolicyError) {
      console.error('Error setting materiales policy:', materialesPolicyError);
      
      // Try a more direct approach with separate statements
      console.log('Trying alternative approach with separate statements...');
      
      try {
        // First enable RLS
        await supabase.rpc('execute_sql', {
          sql: `ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;`
        });
        console.log('RLS enabled on materiales table');
        
        // Try to drop existing policy (might fail if it doesn't exist)
        try {
          await supabase.rpc('execute_sql', {
            sql: `DROP POLICY IF EXISTS "Allow anon select" ON public.materiales;`
          });
          console.log('Dropped existing policy on materiales');
        } catch (e) {
          console.log('No existing policy to drop on materiales');
        }
        
        // Create the policy
        await supabase.rpc('execute_sql', {
          sql: `
            CREATE POLICY "Allow anon select" ON public.materiales
              FOR SELECT
              TO anon
              USING (true);
          `
        });
        console.log('Created policy on materiales table');
      } catch (e) {
        console.error('Error with separate statements approach:', e);
      }
    } else {
      console.log('Successfully set materiales policy');
    }
    
    // Now let's verify that anonymous access works
    console.log('\nVerifying anonymous access:');
    
    // Create a client with the anon key instead of service role key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
      return;
    }
    
    const anonClient = createClient(supabaseUrl, anonKey);
    
    // Check if we can read from inventario
    const { data: inventarioData, error: inventarioError } = await anonClient
      .from('inventario')
      .select('*')
      .limit(5);
    
    if (inventarioError) {
      console.error('Anonymous access to inventario failed:', inventarioError);
    } else {
      console.log('Anonymous access to inventario succeeded!');
      console.log(`Found ${inventarioData.length} rows in inventario table.`);
    }
    
    // Check if we can read from materiales
    const { data: materialesData, error: materialesError } = await anonClient
      .from('materiales')
      .select('*')
      .limit(5);
    
    if (materialesError) {
      console.error('Anonymous access to materiales failed:', materialesError);
    } else {
      console.log('Anonymous access to materiales succeeded!');
      console.log(`Found ${materialesData.length} rows in materiales table.`);
    }
    
  } catch (error) {
    console.error('Error during RLS configuration:', error);
  }

  console.log('\nScript execution completed.');
}

// Execute the function
fixRlsPolicies(); 