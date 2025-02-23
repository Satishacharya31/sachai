import { createClient } from '@supabase/supabase-js'

// Check for environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL environment variable');
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)