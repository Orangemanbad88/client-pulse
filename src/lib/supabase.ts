import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/\s/g, '');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\s/g, '') || undefined;

/**
 * Browser client — uses supabase-js directly (no SSR cookie handling needed).
 */
export const createBrowserSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server client — for API routes and server actions.
 * Uses service role key when available for full CRUD access.
 */
export const createServerSupabaseClient = () => {
  const key = supabaseServiceKey ?? supabaseAnonKey;
  return createServerClient(supabaseUrl, key, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
};
