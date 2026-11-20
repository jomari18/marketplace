import { NextResponse } from "next/server";
import { isUuid } from "@/lib/listings";
import { checkPurchasable, createCheckoutSession } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { updateSellerStatus } from "@/lib/sellers";

const MESSAGES = {
  not_found: "This listing no longer exists.",
  sold: "Sorry, this item has already been sold.",
  seller_not_onboarded: "This seller can't accept online payments yet.",
  price_too_low: "This item's price is too low for online payment.",
} as const;

/**
 * POST /api/checkout  { listingId }
 * The browser sends ONLY the listing id. The price, fee and seller account
 * all come from the database, and we re-check that it's still for sale.
 */
export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  const listingId = input?.listingId;
  if (!isUuid(listingId)) {
    return NextResponse.json({ error: MESSAGES.not_found }, { status: 400 });
  }

  try {
    const check = await checkPurchasable(listingId);
    if (!check.ok) {
      return NextResponse.json({ error: MESSAGES[check.reason] }, { status: 409 });
    }

    // Double-check with Stripe that the seller can still take payments
    // (our copy could be a little behind if a webhook hasn't arrived).
    const account = await getStripe().accounts.retrieve(check.seller.stripe_account_id);
    if (!account.charges_enabled) {
      await updateSellerStatus(account.id, {
        charges_enabled: false,
        details_submitted: Boolean(account.details_submitted),
      });
      return NextResponse.json({ error: MESSAGES.seller_not_onboarded }, { status: 409 });
    }

    const url = await createCheckoutSession(check, new URL(request.url).origin);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Could not create Checkout Session", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
