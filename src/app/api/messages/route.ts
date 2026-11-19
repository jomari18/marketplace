import { NextResponse } from "next/server";
import { EMAIL_PATTERN, LIMITS } from "@/lib/constants";
import { isUuid } from "@/lib/listings";
import { notifySeller } from "@/lib/notify-seller";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/messages
 * 1. Validate the input.
 * 2. Save the message with the PUBLIC anon key, so RLS applies
 *    (anon may INSERT messages but never read them).
 * 3. Try to email the seller. If that fails, the message is still saved.
 */
export async function POST(request: Request) {
  const input = await request.json().catch(() => null);

  const listingId = input?.listingId;
  const buyerName = typeof input?.buyerName === "string" ? input.buyerName.trim() : "";
  const buyerEmail = typeof input?.buyerEmail === "string" ? input.buyerEmail.trim().toLowerCase() : "";
  const body = typeof input?.body === "string" ? input.body.trim() : "";

  if (
    !isUuid(listingId) ||
    !buyerName ||
    buyerName.length > LIMITS.nameMax ||
    !EMAIL_PATTERN.test(buyerEmail) ||
    buyerEmail.length > LIMITS.emailMax ||
    !body ||
    body.length > LIMITS.messageMax
  ) {
    return NextResponse.json({ error: "Please check your name, email and message." }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("messages")
    .insert({ listing_id: listingId, buyer_name: buyerName, buyer_email: buyerEmail, body });
  // No .select() here: anon has no SELECT permission on messages, by design.

  if (error) {
    console.error("Could not save message", error);
    const notFound = error.code === "23503"; // foreign key: listing doesn't exist
    return NextResponse.json(
      { error: notFound ? "This listing no longer exists." : "Could not save your message." },
      { status: notFound ? 404 : 500 },
    );
  }

  const emailed = await notifySeller({ listingId, buyerName, buyerEmail, body });
  return NextResponse.json({ saved: true, emailed }, { status: 201 });
}
