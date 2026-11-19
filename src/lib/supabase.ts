import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public keys from .env.local / Vercel. Safe in the browser: Row Level
// Security and column grants in the database decide what they can do.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** One shared Supabase client using the public anon key (browser or server). */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  client ??= createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}
