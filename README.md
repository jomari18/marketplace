# Marketplace (Test 3 + Test 4: Stripe Connect)

A mini buy-and-sell marketplace. Anyone can list an item with a photo, browse listings by category or keyword, open a listing, and message the seller. **Test 4** adds payments: sellers connect a Stripe account, buyers click **Buy Now** and pay with Stripe Checkout, the seller is paid minus a 10% platform fee, and the listing is marked **Sold**. No login.

**Stack:** Next.js 15 (App Router, TypeScript) · Supabase (Postgres + Storage) · Stripe Connect (sandbox) · Resend (email) · Vercel
**Design:** based on the Figma "Preloved Secondhand Marketplace" UI kit (light mode).

- **Live:** https://marketplace-sand-rho.vercel.app
- **Code:** https://github.com/jomari18/marketplace
- **Previous test:** Test 2 "My Wall" (https://github.com/jomari18/my-wall), whose patterns this reuses

## Current status

| Feature | Status |
| --- | --- |
| **Test 3** create listing, grid + tabs, detail, Message Seller | ✅ live |
| Test 3 bonus: keyword search, seller email via Resend | ✅ live |
| Test 3 security: RLS, column grants, CHECK constraints | ✅ verified with direct API calls |
| **Test 4** seller onboarding (Connect with Stripe) | ✅ live |
| Test 4 Buy Now → Stripe Checkout (direct charge, 10% fee) | ✅ live (₱2,300 test sale, ₱230 fee) |
| Test 4 webhook → order saved + listing Sold | ✅ live: signed `checkout.session.completed` → 200, order saved, listing Sold (delivered via Stripe CLI, see below) |

**Known limits**
- Resend's free test sender only delivers to the Resend account owner's email. Messages are always saved.
- **Webhook endpoint limit:** the shared sandbox already has 16 test webhook endpoints (Stripe's maximum), all from other applicants, so `scripts/create-webhook.mjs` fails with "maximum of 16 test webhook endpoints". We did not delete anyone else's endpoint. Instead the live webhook was tested with the Stripe CLI forwarding real Connect events to the production URL (see "Deploy Test 4", step 4b). Once a slot is free, run the script as written.
- No login (as the test asks): a seller is identified by the email on their listings. Anyone who types a seller's email on the Connect page could start onboarding for it. A real app would verify the email first.

## Features

- **Create listing** (`/listings/new`): photo, title, description, price, category, seller email
- **Home** (`/`): grid, category tabs, keyword search, **Sold** badges, "Buy Now available" tags
- **Listing detail** (`/listings/[id]`): photo, details, **Buy Now** (if the seller is onboarded and it isn't sold), Message Seller
- **Get paid** (`/sell/connect`): seller enters their email → Stripe-hosted onboarding → back to `/sell/connect/return`
- **Checkout**: Stripe Checkout as a **direct charge** on the seller's connected account with a **10% `application_fee_amount`**
- **Order confirmation** (`/orders/success`), **cancel page** (`/orders/cancel`)
- **Webhook** (`/api/stripe/webhook`): `checkout.session.completed` records the order and marks the listing Sold; `account.updated` tracks `charges_enabled`
- **Email notification** for messages (Resend, server-side; failures never lose the message)

## Deploy Test 4 (exact order)

1. **Run the migration** in Supabase SQL Editor: [`supabase/migrations/20261121000000_stripe_connect.sql`](supabase/migrations/20261121000000_stripe_connect.sql) (already applied to the live project).
2. **Add env vars in Vercel** (Settings → Environment Variables): `STRIPE_SECRET_KEY` (secret) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. **Deploy** (push to `main`, or Redeploy).
4. **Register the webhook**: `node --env-file=.env.local scripts/create-webhook.mjs`. It prints `whsec_...` **once**; copy it.
   - **4b. If it fails with "maximum of 16 test webhook endpoints"** (shared sandbox full): forward events with the Stripe CLI instead, which prints its own `whsec_`:
     `stripe listen --api-key YOUR_sk_test --events checkout.session.completed,account.updated --forward-connect-to https://marketplace-sand-rho.vercel.app/api/stripe/webhook`
     (PowerShell: don't type `<...>` placeholders, `<` is an operator.) It only delivers while the command runs.
5. **Add `STRIPE_WEBHOOK_SECRET`** (the `whsec_...`) in Vercel as a secret.
6. **Redeploy** so the new secret is used.
7. **Onboard a test seller** at `/sell/connect` (use Stripe's test buttons: test phone, code `000000`, test bank account).
8. **Create a listing** with that same email.
9. **Buy it** with card `4242 4242 4242 4242`, any future date, any CVC → success page, order in Supabase, listing shows **Sold**.

## Run it locally

1. Create a Supabase project and run **both** migrations in `supabase/migrations/` in order.
2. Copy `.env.example` to `.env.local` and fill it in:

   | Variable | Where to find it | Visible to browser? |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | yes (safe) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API keys → `anon` | yes (safe, RLS protects data) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API keys → secret / `service_role` | **no, server only** |
   | `RESEND_API_KEY` | resend.com → API Keys | **no, server only** |
   | `EMAIL_FROM` | optional, e.g. `Marketplace <hi@yourdomain.com>` | no |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | test instructions (sandbox) | yes (not used by redirect checkout) |
   | `STRIPE_SECRET_KEY` | test instructions (sandbox) | **no, server only** |
   | `STRIPE_WEBHOOK_SECRET` | printed by `scripts/create-webhook.mjs`, or `stripe listen` locally | **no, server only** |

3. `npm install` then `npm run dev`.
4. Local webhooks: `stripe listen --api-key $STRIPE_SECRET_KEY --forward-connect-to localhost:3000/api/stripe/webhook` and use the temporary `whsec_` it prints. (Without it, the success page still records the order, idempotently.)

## How the payment flow works

```
Seller: /sell/connect ──email──▶ POST /api/stripe/connect
          creates connected account (or reuses it), saves acct_ in `sellers`,
          returns an Account Link ──▶ Stripe-hosted onboarding ──▶ /sell/connect/return
          (account.updated webhook + the return page keep charges_enabled in sync)

Buyer:  Buy Now ──listingId only──▶ POST /api/checkout
          server loads price + seller from the DB, re-checks "not sold" and
          "seller can accept charges", then creates a Checkout Session ON the
          seller's account with application_fee_amount = 10% ──▶ Stripe Checkout
          ──paid──▶ /orders/success          ──cancel──▶ /orders/cancel

Stripe: checkout.session.completed ──▶ POST /api/stripe/webhook
          verify signature (raw body) → ignore if not ours → insert order
          (UNIQUE checkout_session_id = idempotent) → listing.status = 'sold'
```

**Currency:** the sandbox platform is in Estonia (EUR settlement), but it accepts **PHP** charges, so listings stay priced in ₱ and are charged in PHP. Amounts go to Stripe in the smallest unit: ₱1,500.00 → `150000` centavos. Fee = `round(amount × 10%)`. Minimum online price is ₱50 (Stripe's minimum is about €0.50).

**Account type:** Express-style connected accounts (`controller.stripe_dashboard.type = "express"`, platform pays Stripe fees, Stripe owns losses because this sandbox requires it). Onboarding needs no password or 2FA, and card_payments lets us make direct charges.

## Project structure

```
src/
  app/
    page.tsx                       home: hero, stats, search, tabs, grid
    listings/new/page.tsx          create listing
    listings/[id]/page.tsx         detail + Buy Now + Message Seller
    sell/connect/page.tsx          "Connect with Stripe"
    sell/connect/return/page.tsx   back from onboarding (live status check)
    orders/success/page.tsx        order confirmation
    orders/cancel/page.tsx         checkout canceled
    api/messages/route.ts          save message + email seller
    api/stripe/connect/route.ts    create/reuse connected account + Account Link
    api/stripe/connect/refresh/    new Account Link when the old one expires
    api/checkout/route.ts          server-priced Checkout Session (direct charge)
    api/stripe/webhook/route.ts    signature-verified webhook
  lib/
    stripe.ts                      server-only Stripe client, APP_TAG, fee %
    payments.ts                    pricing, purchasability, Checkout, fulfillment
    sellers.ts                     sellers table (service role)
    onboarding.ts                  Account Links
    listings.ts                    public listing queries
    supabase.ts / supabase-admin.ts
scripts/create-webhook.mjs         registers the Connect webhook endpoint (run once)
supabase/migrations/               Test 3 + Test 4 SQL
```

## Security and privacy

- **RLS on every table.** `listings`: anon may `SELECT` (public columns + `status`) and `INSERT`. `messages`: anon `INSERT` only. `sellers` and `orders`: **no anon access at all**; only the service role (server) reads/writes them.
- **Seller email is private, enforced by the database** (column grants exclude `seller_email`). Matching listings to sellers happens on the server.
- **Price and fee are computed on the server from the database.** The browser only sends a listing id. The server re-checks "not sold" and "seller can accept charges" (also live with Stripe) before creating the session.
- **Webhook signature verified** with `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` on every request.
- **Shared sandbox:** every session/account we create is tagged `metadata.app = "jomari-marketplace"`. Events for unknown sessions or accounts are ignored with `200`.
- **Idempotent:** `orders.checkout_session_id` is UNIQUE, so the same event twice can't create two orders; `orders.listing_id` is UNIQUE, so an item can't be sold twice (a second simultaneous payment is refunded automatically).
- **Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` are server-only (`import "server-only"` guards). `.env*` is git-ignored.
- **CHECK constraints**, **photo bucket rules** and **search sanitizing** as in Test 3.

## Lessons learned

- **Grants and RLS are separate layers.** The service role bypasses RLS but still needs table privileges on projects created without auto-granted API access. Both migrations grant them explicitly.
- **Never `select=*` on `listings` with the anon key** (it includes `seller_email`). Use `PUBLIC_LISTING_COLUMNS`.
- **Direct charges live on the connected account**, so retrieving a Checkout Session needs `{ stripeAccount }`, and the webhook must be a **Connect** endpoint (`connect: true`).
- **Standard accounts asked the seller for a password and 2FA**; switching to Express-style accounts made test onboarding a few clicks. The sandbox also rejects platform-owned losses on v1 accounts, so `losses.payments = "stripe"`.
- **Vercel env vars only apply to new deployments.** After adding or changing one, Redeploy, or the running site still sees it as unset (`STRIPE_SECRET_KEY is not set` in the logs).
- **Shared sandboxes have shared limits.** 16 webhook endpoints max per account; the Stripe CLI can forward to a deployed URL as a workaround.
- **Stripe amounts are integers in the smallest unit.** Use `Math.round(price * 100)`, never send floats.
