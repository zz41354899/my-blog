import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';

// Create a single supabase client for interacting with your database
export const supabase = createClientComponentClient<Database>();

// Re-export the createClientComponentClient function for components that need to create their own client
export { createClientComponentClient };

export function getSupabase() {
  return supabase;
} 