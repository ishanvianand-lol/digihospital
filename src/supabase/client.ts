// Enhanced Supabase client with better session persistence
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Custom storage implementation to ensure localStorage works properly
const customStorageAdapter = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: {
      // Use custom storage adapter
      storage: customStorageAdapter,
      // Keep session persistent across page reloads
      persistSession: true,
      // Automatically refresh token when it expires
      autoRefreshToken: true,
      // Detect session in URL (for email confirmations, OAuth)
      detectSessionInUrl: true,
      // Storage key for the session
      storageKey: 'supabase.auth.token',
      // Flow type for OAuth
      flowType: 'pkce',
    },
  }
);