import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have the required environment variables
if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not defined in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not defined. Using anonymous key instead.');
}

if (!supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

async function checkSupabaseData() {
  console.log('='.repeat(80));
  console.log('CHECKING SUPABASE DATA');
  console.log('='.repeat(80));
  console.log('URL:', supabaseUrl);
  console.log('Using service key:', !!supabaseServiceKey);
  console.log('\n');

  try {
    // Check inventario table
    console.log('-'.repeat(40));
    console.log('CHECKING INVENTARIO TABLE');
    console.log('-'.repeat(40));

    // Get the count of records
    const { data: countData, error: countError } = await supabase
      .from('inventario')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error checking inventario table:', countError);
    } else {
      console.log(`Inventario table has records: ${countData !== null}`);
      
      // Get actual data
      const { data: productosData, error: productosError } = await supabase
        .from('inventario')
        .select('*')
        .order('mueble_id');
        
      if (productosError) {
        console.error('Error fetching inventario data:', productosError);
      } else {
        console.log(`Retrieved ${productosData.length} inventario records`);
        if (productosData.length > 0) {
          console.log('First record:', JSON.stringify(productosData[0], null, 2));
          console.log('Keys:', Object.keys(productosData[0]).join(', '));
        } else {
          console.log('No records found in inventario table');
        }
      }
    }

    console.log('\n');

    // Check materiales table
    console.log('-'.repeat(40));
    console.log('CHECKING MATERIALES TABLE');
    console.log('-'.repeat(40));

    // Get count
    const { data: matCountData, error: matCountError } = await supabase
      .from('materiales')
      .select('*', { count: 'exact', head: true });

    if (matCountError) {
      console.error('Error checking materiales table:', matCountError);
    } else {
      console.log(`Materiales table has records: ${matCountData !== null}`);
      
      // Get actual data
      const { data: materialesData, error: materialesError } = await supabase
        .from('materiales')
        .select('*')
        .order('id_material');
        
      if (materialesError) {
        console.error('Error fetching materiales data:', materialesError);
      } else {
        console.log(`Retrieved ${materialesData.length} materiales records`);
        if (materialesData.length > 0) {
          console.log('First record:', JSON.stringify(materialesData[0], null, 2));
          console.log('Keys:', Object.keys(materialesData[0]).join(', '));
        } else {
          console.log('No records found in materiales table');
        }
      }
    }

    console.log('\n');
    console.log('='.repeat(80));
    console.log('CHECK COMPLETE');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('Unexpected error during check:', err);
  }
}

// Run the check
checkSupabaseData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 