import { cache } from "react";
import { getSupabase } from "./supabase";
import { isCategory, type CategorySlug } from "./constants";

/**
 * The PUBLIC shape of a listing. seller_email is deliberately missing:
 * the database doesn't let the public read it, and we never ask for it.
 */
export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: CategorySlug;
  image_url: string;
  status: "available" | "sold"; // Test 4: set to "sold" by the Stripe webhook
  created_at: string;
};

// Always list columns explicitly. "select=*" would include seller_email,
// which the anon role has no permission to read, so the query would fail.
export const PUBLIC_LISTING_COLUMNS =
  "id, title, description, price, category, image_url, status, created_at";

/** Make user search text safe to put inside a PostgREST filter. */
export function cleanSearch(raw: string | undefined): string {
  return (raw ?? "")
    .replace(/[,()*%\\:"'.]/g, " ") // characters with special meaning in filters
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** All listings, newest first, optionally filtered by category and keyword. */
export async function fetchListings(options: { category?: string; search?: string }) {
  let query = getSupabase()
    .from("listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .order("created_at", { ascending: false });

  if (isCategory(options.category)) {
    query = query.eq("category", options.category);
  }

  const search = cleanSearch(options.search);
  if (search) {
    // Case-insensitive match in the title OR the description.
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Listing[];
}

/** Total number of listings (for the stats strip). */
export async function countListings(): Promise<number> {
  const { count, error } = await getSupabase()
    .from("listings")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One listing by id, or null if it doesn't exist.
 * Wrapped in React's cache() so the page and its <title> share one request.
 */
export const fetchListing = cache(async (id: string): Promise<Listing | null> => {
  if (!UUID_PATTERN.test(id)) return null; // not a valid id: treat as "not found"

  const { data, error } = await getSupabase()
    .from("listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Listing | null;
});

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
