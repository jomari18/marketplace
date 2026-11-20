import { NextResponse } from "next/server";
import { onboardingLink } from "@/lib/onboarding";
import { findSellerByAccount } from "@/lib/sellers";

/** GET /api/stripe/connect/refresh?account=acct_...  (onboarding link expired) */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = url.searchParams.get("account") ?? "";

  // Only make links for accounts that belong to this marketplace.
  const seller = /^acct_[A-Za-z0-9]+$/.test(accountId) ? await findSellerByAccount(accountId) : null;
  if (!seller) return NextResponse.redirect(new URL("/sell/connect", url.origin));

  try {
    return NextResponse.redirect(await onboardingLink(accountId, url.origin));
  } catch (err) {
    console.error("Could not refresh onboarding link", err);
    return NextResponse.redirect(new URL("/sell/connect?error=1", url.origin));
  }
}
