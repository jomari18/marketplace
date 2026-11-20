import { NextResponse } from "next/server";
import { EMAIL_PATTERN, LIMITS } from "@/lib/constants";
import { findSellerByEmail, insertSeller } from "@/lib/sellers";
import { APP_TAG, getStripe } from "@/lib/stripe";
import { onboardingLink } from "@/lib/onboarding";

/**
 * POST /api/stripe/connect  { email }
 * 1. Find this seller's connected account, or create a new one.
 * 2. Save the account id in Supabase (sellers table).
 * 3. Return a one-time Stripe onboarding link; the browser redirects there.
 */
export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.emailMax) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    let seller = await findSellerByEmail(email);

    if (!seller) {
      // An Express-style connected account: Stripe-hosted onboarding with no
      // password or 2FA, and a light Express dashboard for the seller.
      // card_payments lets us create DIRECT CHARGES on this account;
      // the platform covers Stripe fees and keeps a 10% application fee.
      // (This sandbox requires Stripe, not the platform, to own losses.)
      const account = await getStripe().accounts.create({
        email,
        controller: {
          stripe_dashboard: { type: "express" },
          fees: { payer: "application" },
          losses: { payments: "stripe" },
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { app: APP_TAG },
      });
      await insertSeller(email, account.id);
      seller = { email, stripe_account_id: account.id, charges_enabled: false, details_submitted: false };
    }

    const url = await onboardingLink(seller.stripe_account_id, new URL(request.url).origin);
    return NextResponse.json({ url, alreadyEnabled: seller.charges_enabled });
  } catch (err) {
    console.error("Stripe onboarding failed", err);
    return NextResponse.json({ error: "Could not start Stripe onboarding. Please try again." }, { status: 500 });
  }
}
