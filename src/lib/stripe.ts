// Server-only: the build fails if this is ever imported into browser code,
// so STRIPE_SECRET_KEY can never reach visitors.
import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** One shared Stripe client using the secret key from env vars. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(key);
  return client;
}

/**
 * The sandbox is shared with other candidates. We tag every Checkout
 * Session and connected account we create with this value, so the webhook
 * can ignore events that aren't ours.
 */
export const APP_TAG = "jomari-marketplace";

/** Platform fee: 10% of the item price. */
export const PLATFORM_FEE_PERCENT = 10;
