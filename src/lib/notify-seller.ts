import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";

type NewMessage = {
  listingId: string;
  buyerName: string;
  buyerEmail: string;
  body: string;
};

/**
 * Email the seller about a new message using Resend's HTTP API.
 * Runs only on the server, so RESEND_API_KEY never reaches the browser.
 * Returns true if the email was sent. Never throws: the message is
 * already saved, so an email problem must not turn into an error.
 */
export async function notifySeller(message: NewMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Marketplace <onboarding@resend.dev>";
  const admin = getSupabaseAdmin();
  if (!apiKey || !admin) return false; // email not configured: skip quietly

  try {
    // Only the server (service role) can read the private seller email.
    const { data: listing, error } = await admin
      .from("listings")
      .select("title, seller_email")
      .eq("id", message.listingId)
      .single();
    if (error || !listing) throw error ?? new Error("Listing not found");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [listing.seller_email],
        reply_to: message.buyerEmail, // seller hits "Reply" to answer the buyer directly
        subject: `New message about "${listing.title}"`,
        text: [
          `${message.buyerName} (${message.buyerEmail}) sent you a message about "${listing.title}":`,
          "",
          message.body,
          "",
          "Reply to this email to answer them.",
        ].join("\n"),
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
    return true;
  } catch (err) {
    console.error("Seller notification email failed (message is still saved)", err);
    return false;
  }
}
