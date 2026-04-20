import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'fallback_key_to_prevent_fatal_crash';

// Use native AsyncStorage only on native platforms.
// On web/SSR, omit custom storage so Supabase uses its own safe defaults.
const authStorage = Platform.OS !== 'web' ? AsyncStorage : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: Platform.OS !== 'web',
    detectSessionInUrl: false,
  },
});
