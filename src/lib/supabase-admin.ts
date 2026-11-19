// "server-only" makes the build FAIL if this file is ever imported into
// browser code, so the service role key can never leak to visitors.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * It bypasses RLS, so we use it for exactly one job: looking up a
 * listing's private seller email to send the notification email.
 * Returns null when the key isn't configured (email is then skipped).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
