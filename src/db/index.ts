import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Verificar la variable de entorno
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida');
}

// Crear cliente postgres
const client = postgres(process.env.DATABASE_URL);

// Crear instancia de Drizzle con el esquema
export const db = drizzle(client, { schema });

// Re-exportar el esquema para facilitar el acceso
export * from './schema';