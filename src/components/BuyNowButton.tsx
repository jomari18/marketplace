"use client";

import { useState } from "react";

type BuyNowButtonProps = {
  listingId: string;
};

/**
 * Sends ONLY the listing id to our server. The server works out the price
 * and fee from the database and returns a Stripe Checkout URL.
 */
export default function BuyNowButton({ listingId }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url; // Stripe-hosted Checkout page
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="buy">
      <button type="button" className="button button--block button--buy" onClick={handleClick} disabled={loading}>
        {loading && <span className="spinner" aria-hidden="true" />}
        {loading ? "Opening secure checkout…" : "Buy Now"}
      </button>
      <p className="field__hint buy__hint">Secure payment by Stripe. You&apos;ll be redirected to complete your purchase.</p>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
