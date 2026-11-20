import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillCheckout } from "@/lib/payments";
import { updateSellerStatus } from "@/lib/sellers";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/webhook
 * Registered with connect: true, so we receive events from connected
 * accounts (event.account = the seller's acct_ id).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // 1. Verify the signature using the RAW body. If anyone changed even one
  //    byte, or it wasn't signed with our secret, this throws.
  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.warn("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Handle the events we care about. The sandbox is shared, so anything
  //    for accounts/orders we don't recognize is ignored (still 200).
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        if (!event.account) break; // not from a connected account
        const result = await fulfillCheckout(event.data.object, event.account);
        console.log(`checkout.session.completed ${event.id}: ${result}`);
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        const known = await updateSellerStatus(account.id, {
          charges_enabled: Boolean(account.charges_enabled),
          details_submitted: Boolean(account.details_submitted),
        });
        if (known) console.log(`account.updated ${account.id}: charges_enabled=${account.charges_enabled}`);
        break;
      }
      default:
        break; // not an event we use
    }
  } catch (err) {
    // A real failure on OUR side: return 500 so Stripe retries later.
    // Retries are safe because fulfillCheckout is idempotent.
    console.error(`Webhook handler failed for ${event.id}`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
