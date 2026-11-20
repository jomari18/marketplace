import type { Metadata } from "next";
import Link from "next/link";
import { findSellerByAccount, updateSellerStatus } from "@/lib/sellers";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Stripe onboarding" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ account?: string }> };

/** Stripe sends the seller here after onboarding. We check their status live. */
export default async function ConnectReturnPage({ searchParams }: Props) {
  const { account: accountId = "" } = await searchParams;

  let state: "ready" | "pending" | "unknown" = "unknown";
  const seller = /^acct_[A-Za-z0-9]+$/.test(accountId) ? await findSellerByAccount(accountId) : null;

  if (seller) {
    try {
      // Ask Stripe directly (the account.updated webhook also keeps this in sync).
      const account = await getStripe().accounts.retrieve(accountId);
      await updateSellerStatus(accountId, {
        charges_enabled: Boolean(account.charges_enabled),
        details_submitted: Boolean(account.details_submitted),
      });
      state = account.charges_enabled ? "ready" : "pending";
    } catch (err) {
      console.error("Could not check Stripe account", err);
    }
  }

  return (
    <section className="section section--narrow">
      <div className={`result result--${state === "ready" ? "success" : "neutral"}`} role="status">
        {state === "ready" && (
          <>
            <p className="eyebrow">YOU&apos;RE CONNECTED</p>
            <h1 className="page-title">You can accept payments</h1>
            <p className="muted">
              Every listing with your email now shows a Buy Now button. Payments go straight to your Stripe account.
            </p>
            <div className="result__actions">
              <Link href="/listings/new" className="button">
                Sell an item
              </Link>
              <Link href="/#listings" className="button button--ghost">
                Browse listings
              </Link>
            </div>
          </>
        )}
        {state === "pending" && (
          <>
            <p className="eyebrow">ALMOST THERE</p>
            <h1 className="page-title">Onboarding isn&apos;t finished</h1>
            <p className="muted">
              Stripe still needs a few details before you can accept payments. Pick up where you left off.
            </p>
            <div className="result__actions">
              <a href={`/api/stripe/connect/refresh?account=${accountId}`} className="button">
                Continue onboarding
              </a>
            </div>
          </>
        )}
        {state === "unknown" && (
          <>
            <h1 className="page-title">We couldn&apos;t find that account</h1>
            <p className="muted">Start again with your seller email.</p>
            <div className="result__actions">
              <Link href="/sell/connect" className="button">
                Connect with Stripe
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
