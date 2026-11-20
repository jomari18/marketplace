import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { isUuid } from "@/lib/listings";
import { formatMinorAmount } from "@/lib/format";
import { fulfillCheckout, loadPrivateListing } from "@/lib/payments";
import { findSellerByEmail } from "@/lib/sellers";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string; listing?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId = "", listing: listingId = "" } = await searchParams;

  // Look the session up on the seller's account (it's a direct charge),
  // and only show it if it's paid and really belongs to this listing.
  let order: { title: string; image: string; amount: string; email: string | null } | null = null;
  try {
    const listing = isUuid(listingId) ? await loadPrivateListing(listingId) : null;
    const seller = listing ? await findSellerByEmail(listing.seller_email) : null;
    if (listing && seller && /^cs_/.test(sessionId)) {
      const session = await getStripe().checkout.sessions.retrieve(
        sessionId,
        {},
        { stripeAccount: seller.stripe_account_id }, // the session lives on the seller's account
      );
      if (session.payment_status === "paid" && session.metadata?.listing_id === listing.id) {
        // The webhook is the main way orders are recorded. Doing it here too
        // (idempotently) means the order shows even if the webhook is slow.
        await fulfillCheckout(session, seller.stripe_account_id);
        order = {
          title: listing.title,
          image: listing.image_url,
          amount: formatMinorAmount(session.amount_total ?? 0, session.currency ?? "php"),
          email: session.customer_details?.email ?? null,
        };
      }
    }
  } catch (err) {
    console.error("Could not load order", err);
  }

  if (!order) {
    return (
      <section className="section section--narrow">
        <div className="result result--neutral" role="status">
          <h1 className="page-title">We couldn&apos;t confirm this order</h1>
          <p className="muted">If you were charged, you&apos;ll get a receipt from Stripe by email.</p>
          <div className="result__actions">
            <Link href="/#listings" className="button">
              Browse listings
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--narrow">
      <div className="result result--success" role="status">
        <p className="eyebrow">ORDER CONFIRMED</p>
        <h1 className="page-title">Thank you for your purchase!</h1>
        <p className="muted">
          {order.email ? `A receipt is on its way to ${order.email}. ` : ""}The seller has been paid and will contact you
          to arrange delivery or meet-up.
        </p>

        <div className="order-summary">
          <div className="order-summary__media">
            <Image src={order.image} alt="" fill sizes="120px" className="detail__image" />
          </div>
          <div>
            <p className="card__category">Your item</p>
            <p className="order-summary__title">{order.title}</p>
            <p className="card__price">{order.amount}</p>
            <span className="tag tag--small">PAID</span>
          </div>
        </div>

        <div className="result__actions">
          <Link href={`/listings/${listingId}`} className="button">
            View listing
          </Link>
          <Link href="/#listings" className="button button--ghost">
            Keep browsing
          </Link>
        </div>
      </div>
    </section>
  );
}
