import type { Metadata } from "next";
import Link from "next/link";
import { isUuid } from "@/lib/listings";

export const metadata: Metadata = { title: "Checkout canceled" };

type Props = { searchParams: Promise<{ listing?: string }> };

export default async function OrderCancelPage({ searchParams }: Props) {
  const { listing } = await searchParams;
  const back = isUuid(listing) ? `/listings/${listing}` : "/#listings";

  return (
    <section className="section section--narrow">
      <div className="result result--neutral" role="status">
        <p className="eyebrow">CHECKOUT CANCELED</p>
        <h1 className="page-title">No payment was made</h1>
        <p className="muted">You left Stripe Checkout before paying, so you weren&apos;t charged. The item is still available.</p>
        <div className="result__actions">
          <Link href={back} className="button">
            Back to the item
          </Link>
          <Link href="/#listings" className="button button--ghost">
            Browse listings
          </Link>
        </div>
      </div>
    </section>
  );
}
