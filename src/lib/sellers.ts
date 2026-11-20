import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";

export type Seller = {
  email: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  details_submitted: boolean;
};

function admin() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return client;
}

/** Find a seller by email (emails are stored lowercase). */
export async function findSellerByEmail(email: string): Promise<Seller | null> {
  const { data, error } = await admin()
    .from("sellers")
    .select("email, stripe_account_id, charges_enabled, details_submitted")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Find a seller by their connected account id (used by the webhook). */
export async function findSellerByAccount(accountId: string): Promise<Seller | null> {
  const { data, error } = await admin()
    .from("sellers")
    .select("email, stripe_account_id, charges_enabled, details_submitted")
    .eq("stripe_account_id", accountId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Save a new seller after we create their Stripe account. */
export async function insertSeller(email: string, accountId: string): Promise<void> {
  const { error } = await admin()
    .from("sellers")
    .insert({ email: email.trim().toLowerCase(), stripe_account_id: accountId });
  if (error) throw error;
}

/** Keep our copy of the account's status in sync with Stripe. */
export async function updateSellerStatus(
  accountId: string,
  status: { charges_enabled: boolean; details_submitted: boolean },
): Promise<boolean> {
  const { data, error } = await admin()
    .from("sellers")
    .update({ ...status, updated_at: new Date().toISOString() })
    .eq("stripe_account_id", accountId)
    .select("email");
  if (error) throw error;
  return (data?.length ?? 0) > 0; // false = not one of our sellers
}

/** Emails of every seller who can accept payments right now. */
export async function chargeableSellerEmails(): Promise<Set<string>> {
  const { data, error } = await admin().from("sellers").select("email").eq("charges_enabled", true);
  if (error) throw error;
  return new Set((data ?? []).map((s) => s.email));
}
