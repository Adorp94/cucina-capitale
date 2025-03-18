import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedData() {
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

  // Sample materials data with explicit IDs since id_material isn't auto-generated
  const materials = [
    { id_material: 1, tipo: 'Madera', nombre: 'Pino', costo: 250, categoria: 'Estructura', comentario: 'Madera común para muebles básicos' },
    { id_material: 2, tipo: 'Madera', nombre: 'Roble', costo: 450, categoria: 'Estructura', comentario: 'Madera dura y resistente' },
    { id_material: 3, tipo: 'Herraje', nombre: 'Jaladera básica', costo: 35, categoria: 'Herraje', comentario: 'Jaladera de metal' },
    { id_material: 4, tipo: 'Herraje', nombre: 'Bisagra estándar', costo: 25, categoria: 'Herraje', comentario: 'Bisagra de acero' },
    { id_material: 5, tipo: 'Herraje', nombre: 'Corredera 45cm', costo: 120, categoria: 'Herraje', comentario: 'Corredera de cajón' },
  ];

  // First version of products - we'll adjust these based on inspection of the table structure
  const basicProducts = [
    {
      mueble_id: 1,
      nombre_mueble: 'Alacena de Cocina',
      cajones: 3,
      puertas: 2,
      entrepaños: 1,
      mat_huacal: 1, // Pino
      mat_vista: 2,  // Roble
      jaladera: 3,   // Jaladera básica
      corredera: 5,  // Corredera 45cm
      bisagras: 4,   // Bisagra estándar
      cif: 5000
    },
    {
      mueble_id: 2,
      nombre_mueble: 'Vestidor Completo',
      cajones: 5,
      puertas: 4,
      entrepaños: 3,
      mat_huacal: 2, // Roble
      mat_vista: 1,  // Pino
      jaladera: 3,   // Jaladera básica
      corredera: 5,  // Corredera 45cm
      bisagras: 4,   // Bisagra estándar
      cif: 12000
    }
  ];

  try {
    // First try a simple query to verify connection
    console.log('Testing connection with a simple query...');
    const { data: testData, error: testError } = await supabase
      .from('materiales')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
    } else {
      console.log('Connection successful!', testData.length ? 'Got data.' : 'No data yet.');
    }
    
    // Let's check the structure of the inventario table
    console.log('Inspecting inventario table structure...');
    const { data: inspectData, error: inspectError } = await supabase
      .rpc('inspect_table', { table_name: 'inventario' })
      .select('*');
    
    if (inspectError) {
      console.error('Error inspecting table:', inspectError);
      // Let's try a direct query to get sample data instead
      console.log('Trying to get sample data instead...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('inventario')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error getting sample data:', sampleError);
      } else {
        console.log('Sample data structure:', sampleData && sampleData.length > 0 ? 
          Object.keys(sampleData[0]).join(', ') : 'No data found');
      }
    } else {
      console.log('Table structure:', inspectData);
    }
    
    // First delete existing data to avoid conflicts
    console.log('Cleaning up existing data...');
    
    // Delete products first (because they reference materials)
    const { error: deleteProductsError } = await supabase
      .from('inventario')
      .delete()
      .gte('mueble_id', 0);
      
    if (deleteProductsError) {
      console.error('Error deleting existing products:', deleteProductsError);
    } else {
      console.log('Existing products deleted.');
    }
    
    // Then delete materials
    const { error: deleteMaterialsError } = await supabase
      .from('materiales')
      .delete()
      .gte('id_material', 0);
      
    if (deleteMaterialsError) {
      console.error('Error deleting existing materials:', deleteMaterialsError);
    } else {
      console.log('Existing materials deleted.');
    }
    
    // Insert new materials
    console.log('Inserting materials...');
    const { data, error } = await supabase
      .from('materiales')
      .insert(materials)
      .select();
    
    if (error) {
      console.error('Error inserting materials:', error);
    } else {
      console.log('Materials inserted successfully:', data.length, 'records');
      
      // Insert products - one by one to isolate errors
      console.log('Inserting products one by one to identify issues...');
      
      for (let i = 0; i < basicProducts.length; i++) {
        const product = basicProducts[i];
        console.log(`Inserting product ${i+1}:`, product.nombre_mueble);
        
        const { data: productData, error: productError } = await supabase
          .from('inventario')
          .insert([product])
          .select();
          
        if (productError) {
          console.error(`Error inserting product ${i+1}:`, productError);
        } else {
          console.log(`Product ${i+1} inserted successfully:`, productData[0].mueble_id);
        }
      }
    }
  } catch (error) {
    console.error('Error during seed operation:', error);
  }

  console.log('Script execution completed.');
}

// Execute the seed function
seedData(); 