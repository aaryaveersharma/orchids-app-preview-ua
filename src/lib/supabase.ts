import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, key };
};

const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

let capacitorStorage: any = undefined;

if (isNative) {
  try {
    const { Preferences } = require('@capacitor/preferences');
    capacitorStorage = {
      getItem: async (key: string) => {
        try {
          const { value } = await Preferences.get({ key });
          return value;
        } catch {
          return localStorage.getItem(key);
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await Preferences.set({ key, value });
        } catch {
          localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        try {
          await Preferences.remove({ key });
        } catch {
          localStorage.removeItem(key);
        }
      }
    };
  } catch (e) {
    console.warn('Capacitor Preferences not available', e);
  }
}

const { url, key } = getSupabaseConfig();

// We create a proxy or a lazy-initialized client to avoid crashes if env vars are missing during build/init
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: {
    storage: capacitorStorage || (typeof window !== 'undefined' ? localStorage : undefined),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
