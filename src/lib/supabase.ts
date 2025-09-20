// src/lib/supabase.ts
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// pull your secrets out of the merged Expo config
const {
  supabaseUrl,
  supabaseAnonKey,
} = (Constants.expoConfig!.extra as {
  supabaseUrl: string;
  supabaseAnonKey: string;
});

// Create a mock client if credentials are missing (for development/testing)
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase credentials - using mock client for offline functionality');
  
  // Create a mock Supabase client for offline-only mode
  supabase = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      signIn: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ data: null, error: null }),
    },
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };