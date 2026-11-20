"use client";

import { useState } from "react";
import { EMAIL_PATTERN } from "@/lib/constants";

/** Seller enters their email, then we send them to Stripe's hosted onboarding. */
export default function ConnectForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter the same email you used on your listings.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Request failed");
      window.location.href = data.url; // Stripe-hosted onboarding
    } catch (err) {
      console.error("Could not start onboarding", err);
      setError("Sorry, we couldn't connect to Stripe. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form className="connect-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
      <div className="field">
        <label htmlFor="connect-email" className="field__label">
          Seller email
        </label>
        <input
          id="connect-email"
          className="input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "connect-error connect-hint" : "connect-hint"}
          disabled={loading}
        />
        <p id="connect-hint" className="field__hint">
          Use the email from your listings. Every listing with this email gets a Buy Now button.
        </p>
        {error && (
          <p id="connect-error" className="field__error" role="alert">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="button button--block" disabled={loading}>
        {loading && <span className="spinner" aria-hidden="true" />}
        {loading ? "Opening Stripe…" : "Connect with Stripe"}
      </button>
    </form>
  );
}
