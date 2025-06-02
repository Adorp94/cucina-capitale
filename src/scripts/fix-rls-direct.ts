import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixRlsWithRest() {
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
    // Make direct REST API calls to execute SQL using the service role key
    console.log('\nUsing REST API to update RLS policies...');
    
    // The URL for the pg API
    const pgApiUrl = `${supabaseUrl}/rest/v1/`;
    
    // Execute function to disable RLS on insumos
    console.log('Disabling RLS on insumos...');
    const disableInsumosResponse = await fetch(`${pgApiUrl}rpc/disable_rls_insumos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({})
    });
    
    const disableInsumosResult = await disableInsumosResponse.json();
    console.log('Disable RLS on insumos result:', disableInsumosResponse.status, disableInsumosResult);
    
    // Execute function to disable RLS on materiales
    console.log('Disabling RLS on materiales...');
    const disableMaterialesResponse = await fetch(`${pgApiUrl}rpc/disable_rls_materiales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({})
    });
    
    const disableMaterialesResult = await disableMaterialesResponse.json();
    console.log('Disable RLS on materiales result:', disableMaterialesResponse.status, disableMaterialesResult);
    
    // Test anonymous access after RLS changes
    console.log('\nTesting anonymous access after changes:');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
      return;
    }
    
    const anonClient = createClient(supabaseUrl, anonKey);
    
    // Check if we can read from insumos with anon key
    const { data: insumosData, error: insumosError } = await anonClient
      .from('insumos')
      .select('*');
    
    if (insumosError) {
      console.error('Anonymous access to insumos failed:', insumosError);
    } else {
      console.log(`Anonymous access: Found ${insumosData.length} rows in insumos table`);
      if (insumosData.length > 0) {
        console.log('First row:', insumosData[0]);
      }
    }
    
    // Check if we can read from materiales with anon key
    const { data: materialesData, error: materialesError } = await anonClient
      .from('materiales')
      .select('*');
    
    if (materialesError) {
      console.error('Anonymous access to materiales failed:', materialesError);
    } else {
      console.log(`Anonymous access: Found ${materialesData.length} rows in materiales table`);
      if (materialesData.length > 0) {
        console.log('First row:', materialesData[0]);
      }
    }
    
  } catch (error) {
    console.error('Error during RLS configuration:', error);
  }

  console.log('\nScript execution completed.');
}

// Execute the function
fixRlsWithRest(); 