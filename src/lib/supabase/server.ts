import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  // Check for environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      nodeEnv: process.env.NODE_ENV
    });
    throw new Error('Missing required Supabase environment variables');
  }
  
  console.log('Creating server Supabase client:', {
    url: supabaseUrl.substring(0, 30) + '...',
    hasKey: !!supabaseAnonKey,
    nodeEnv: process.env.NODE_ENV
  });
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cases where cookies can't be set during rendering
            console.warn('Failed to set cookie during rendering:', name);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cases where cookies can't be removed during rendering
            console.warn('Failed to remove cookie during rendering:', name);
          }
        },
      },
    }
  );
}