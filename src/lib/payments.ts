import "server-only";
import type Stripe from "stripe";
import { CURRENCY } from "./constants";
import { chargeableSellerEmails, findSellerByAccount, findSellerByEmail, type Seller } from "./sellers";
import { APP_TAG, PLATFORM_FEE_PERCENT, getStripe } from "./stripe";
import { getSupabaseAdmin } from "./supabase-admin";

function admin() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return client;
}

/**
 * Prices are stored like 2500.00 (pesos). Stripe wants the SMALLEST unit
 * (centavos), so multiply by 100. Rounding avoids float issues like 19.99*100.
 */
export function toSmallestUnit(price: number): number {
  return Math.round(price * 100);
}

/** 10% platform fee, in the smallest unit. */
export function platformFee(amount: number): number {
  return Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
}

// Stripe's minimum charge is about US$0.50; ₱50 keeps us safely above it.
const MIN_AMOUNT = 5000;

type PrivateListing = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  status: "available" | "sold";
  seller_email: string;
};

/** Load a listing INCLUDING the private seller email (server only). */
export async function loadPrivateListing(id: string): Promise<PrivateListing | null> {
  const { data, error } = await admin()
    .from("listings")
    .select("id, title, price, image_url, status, seller_email")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as PrivateListing | null;
}

export type Purchasability =
  | { ok: true; listing: PrivateListing; seller: Seller; amount: number; fee: number }
  | { ok: false; reason: "not_found" | "sold" | "seller_not_onboarded" | "price_too_low" };

/**
 * The single source of truth for "can this be bought right now?".
 * Price and fee come from the DATABASE, never from the browser.
 */
export async function checkPurchasable(listingId: string): Promise<Purchasability> {
  const listing = await loadPrivateListing(listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status === "sold") return { ok: false, reason: "sold" };

  const seller = await findSellerByEmail(listing.seller_email);
  if (!seller || !seller.charges_enabled) return { ok: false, reason: "seller_not_onboarded" };

  const amount = toSmallestUnit(Number(listing.price));
  if (amount < MIN_AMOUNT) return { ok: false, reason: "price_too_low" };

  return { ok: true, listing, seller, amount, fee: platformFee(amount) };
}

/** Ids of all listings that show a Buy Now button (for the home grid). */
export async function purchasableListingIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0 || !getSupabaseAdmin()) return new Set();
  const emails = await chargeableSellerEmails();
  if (emails.size === 0) return new Set();

  const { data, error } = await admin()
    .from("listings")
    .select("id, seller_email, price, status")
    .in("id", ids);
  if (error) throw error;

  return new Set(
    (data ?? [])
      .filter(
        (l) =>
          l.status === "available" &&
          emails.has(l.seller_email) &&
          toSmallestUnit(Number(l.price)) >= MIN_AMOUNT,
      )
      .map((l) => l.id),
  );
}

/**
 * Create a Stripe Checkout Session as a DIRECT CHARGE on the seller's
 * connected account, with our 10% application fee.
 */
export async function createCheckoutSession(
  p: Extract<Purchasability, { ok: true }>,
  origin: string,
): Promise<string> {
  const session = await getStripe().checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: p.amount, // from the database, in centavos
            product_data: { name: p.listing.title, images: [p.listing.image_url] },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: p.fee, // the platform keeps this; the seller gets the rest
        metadata: { app: APP_TAG, listing_id: p.listing.id },
      },
      metadata: { app: APP_TAG, listing_id: p.listing.id, application_fee_amount: String(p.fee) },
      success_url: `${origin}/orders/success?session_id={CHECKOUT_SESSION_ID}&listing=${p.listing.id}`,
      cancel_url: `${origin}/orders/cancel?listing=${p.listing.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    },
    // Direct charge: the payment is created ON the seller's account.
    { stripeAccount: p.seller.stripe_account_id },
  );
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}

export type FulfillResult = "recorded" | "duplicate" | "ignored" | "refunded_already_sold";

/**
 * Record a paid order and mark the listing Sold. Safe to call more than once
 * for the same session (webhook retries, or the success page): the UNIQUE
 * checkout_session_id means only the first call creates an order.
 */
export async function fulfillCheckout(
  session: Stripe.Checkout.Session,
  accountId: string,
): Promise<FulfillResult> {
  // 1. Only handle sessions WE created, for sellers WE know, that are paid.
  const listingId = session.metadata?.listing_id;
  if (session.metadata?.app !== APP_TAG || !listingId) return "ignored";
  if (session.payment_status !== "paid") return "ignored";

  const seller = await findSellerByAccount(accountId);
  const listing = await loadPrivateListing(listingId);
  if (!seller || !listing || listing.seller_email !== seller.email) return "ignored";

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  // 2. Insert the order. Duplicate session -> already recorded, nothing to do.
  const { error } = await admin().from("orders").insert({
    listing_id: listingId,
    stripe_account_id: accountId,
    checkout_session_id: session.id,
    payment_intent_id: paymentIntentId ?? null,
    amount_total: session.amount_total ?? 0,
    application_fee_amount: Number(session.metadata?.application_fee_amount ?? 0),
    currency: session.currency ?? CURRENCY,
    buyer_email: session.customer_details?.email ?? null,
  });

  if (error?.code === "23505") {
    // Unique violation. Same session = duplicate event. Different session for
    // the same listing = two buyers paid at once: refund the second one.
    const { data: existing } = await admin()
      .from("orders")
      .select("checkout_session_id")
      .eq("listing_id", listingId)
      .maybeSingle();
    if (existing?.checkout_session_id === session.id) return "duplicate";

    if (paymentIntentId) {
      await getStripe().refunds.create(
        { payment_intent: paymentIntentId, refund_application_fee: true },
        { stripeAccount: accountId },
      );
    }
    return "refunded_already_sold";
  }
  if (error) throw error;

  // 3. Mark the listing Sold so it can't be bought again.
  const { error: soldError } = await admin()
    .from("listings")
    .update({ status: "sold" })
    .eq("id", listingId);
  if (soldError) throw soldError;

  return "recorded";
}
