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

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in app config');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);