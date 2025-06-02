import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyData() {
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
    // Check data in the insumos table
    console.log('\nChecking data in insumos table:');
    const { data: insumosData, error: insumosError } = await supabase
      .from('insumos')
      .select('*')
      .limit(5);
    
    if (insumosError) {
      console.error('Error fetching insumos data:', insumosError);
    } else {
      console.log(`Found ${insumosData.length} rows in insumos table:`);
      insumosData.forEach(item => {
        console.log(`- Insumo ID: ${item.insumo_id}, Nombre: ${item.mueble || 'N/A'}`);
      });
      
      if (insumosData.length === 0) {
        console.log('Reseeding the insumos table...');
        
        // Basic products data
        const products = [
          {
            mueble: 'Alacena de Cocina',
            cajones: 3,
            puertas: 2,
            entrepaños: 1,
            mat_huacal: 1,
            mat_vista: 2,
            jaladera: 3,
            corredera: 5,
            bisagras: 4,
            cif: 5000
          },
          {
            mueble: 'Vestidor Completo',
            cajones: 5,
            puertas: 4,
            entrepaños: 3,
            mat_huacal: 2,
            mat_vista: 1,
            jaladera: 3,
            corredera: 5,
            bisagras: 4,
            cif: 12000
          }
        ];
        
        const { data: insertData, error: insertError } = await supabase
          .from('insumos')
          .insert(products)
          .select();
          
        if (insertError) {
          console.error('Error inserting products:', insertError);
        } else {
          console.log('Successfully inserted products:', insertData.length);
        }
      }
    }
    
    // Check data in the materiales table
    console.log('\nChecking data in materiales table:');
    const { data: materialesData, error: materialesError } = await supabase
      .from('materiales')
      .select('*');
    
    if (materialesError) {
      console.error('Error fetching materiales data:', materialesError);
    } else {
      console.log(`Found ${materialesData.length} rows in materiales table:`);
      materialesData.forEach(item => {
        console.log(`- ID: ${item.id_material}, Name: ${item.nombre}, Type: ${item.tipo}`);
      });
      
      if (materialesData.length === 0) {
        console.log('Reseeding the materiales table...');
        
        // Sample materials data
        const materials = [
          { id_material: 1, tipo: 'Madera', nombre: 'Pino', costo: 250, categoria: 'Estructura', comentario: 'Madera común para muebles básicos' },
          { id_material: 2, tipo: 'Madera', nombre: 'Roble', costo: 450, categoria: 'Estructura', comentario: 'Madera dura y resistente' },
          { id_material: 3, tipo: 'Herraje', nombre: 'Jaladera básica', costo: 35, categoria: 'Herraje', comentario: 'Jaladera de metal' },
          { id_material: 4, tipo: 'Herraje', nombre: 'Bisagra estándar', costo: 25, categoria: 'Herraje', comentario: 'Bisagra de acero' },
          { id_material: 5, tipo: 'Herraje', nombre: 'Corredera 45cm', costo: 120, categoria: 'Herraje', comentario: 'Corredera de cajón' },
        ];
        
        const { data: insertData, error: insertError } = await supabase
          .from('materiales')
          .insert(materials)
          .select();
          
        if (insertError) {
          console.error('Error inserting materials:', insertError);
        } else {
          console.log('Successfully inserted materials:', insertData.length);
        }
      }
    }
    
    // Test anonymous access
    console.log('\nTesting anonymous access:');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
      return;
    }
    
    const anonClient = createClient(supabaseUrl, anonKey);
    
    // Check if we can read from insumos with anon key
    const { data: anonInsumosData, error: anonInsumosError } = await anonClient
      .from('insumos')
      .select('*');
    
    if (anonInsumosError) {
      console.error('Anonymous access to insumos failed:', anonInsumosError);
    } else {
      console.log(`Anonymous access: Found ${anonInsumosData.length} rows in insumos table`);
    }
    
    // Check if we can read from materiales with anon key
    const { data: anonMaterialesData, error: anonMaterialesError } = await anonClient
      .from('materiales')
      .select('*');
    
    if (anonMaterialesError) {
      console.error('Anonymous access to materiales failed:', anonMaterialesError);
    } else {
      console.log(`Anonymous access: Found ${anonMaterialesData.length} rows in materiales table`);
    }
    
  } catch (error) {
    console.error('Error during data verification:', error);
  }

  console.log('\nScript execution completed.');
}

// Execute the function
verifyData(); 