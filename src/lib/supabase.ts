import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Browser client — for client components (reads via anon key).
 */
export const createBrowserSupabaseClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Server client — for server components, API routes, server actions.
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
