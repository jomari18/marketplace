import "server-only";
import { getStripe } from "./stripe";

/**
 * A one-time link to Stripe's hosted onboarding for a connected account.
 * Links expire after a few minutes, so we make a fresh one each time.
 */
export async function onboardingLink(accountId: string, origin: string): Promise<string> {
  const link = await getStripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    // Stripe sends the seller here if the link expired: we make a new one.
    refresh_url: `${origin}/api/stripe/connect/refresh?account=${accountId}`,
    // ...and here when they finish (or leave) onboarding.
    return_url: `${origin}/sell/connect/return?account=${accountId}`,
  });
  return link.url;
}
