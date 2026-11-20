// These must match the CHECK constraints and bucket settings in
// supabase/migrations. The UI checks first; the database is the final guard.

export const CATEGORIES = [
  { slug: "clothing", label: "Clothing" },
  { slug: "bags", label: "Bags" },
  { slug: "shoes", label: "Shoes" },
  { slug: "electronics", label: "Electronics" },
  { slug: "home", label: "Home" },
  { slug: "other", label: "Other" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function isCategory(value: unknown): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export const LIMITS = {
  titleMin: 3,
  titleMax: 80,
  descriptionMin: 10,
  descriptionMax: 2000,
  priceMax: 10_000_000,
  nameMax: 80,
  messageMax: 1000,
  emailMax: 254,
} as const;

// Currency for prices AND Stripe charges. Listings are priced in pesos.
export const CURRENCY = "php";

export const PHOTO_BUCKET = "listing-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Same idea as the database regex: something@something.tld
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
