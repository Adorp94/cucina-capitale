import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function executeDirectSql() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  // Define the SQL to execute
  const sql = `
    -- Disable RLS on inventario
    ALTER TABLE public.inventario DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS on materiales
    ALTER TABLE public.materiales DISABLE ROW LEVEL SECURITY;
  `;

  try {
    // Make a direct POST request to the Supabase SQL API
    console.log('Executing SQL directly...');
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);

    if (!response.ok) {
      console.error('Error executing SQL');
    } else {
      console.log('SQL executed successfully');
    }
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

executeDirectSql(); 