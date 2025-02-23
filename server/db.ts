import { createClient } from '@supabase/supabase-js';
import { log } from './vite';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get environment variables with proper error handling
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  log('Missing required Supabase environment variables', 'error');
  throw new Error('Missing required Supabase environment variables');
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
);