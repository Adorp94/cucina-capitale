import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with the service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function connectTables() {
  try {
    console.log('Starting table connection process...');
    
    // Read the SQL script
    const sqlFilePath = path.join(process.cwd(), 'sql', 'connect_tables.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split into individual statements and execute them one by one
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Execute the SQL statement
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
      } else {
        console.log(`Successfully executed statement ${i + 1}.`);
      }
    }
    
    console.log('Table connection process completed.');
  } catch (error) {
    console.error('Error in connectTables:', error);
  }
}

// Execute the function
connectTables()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 