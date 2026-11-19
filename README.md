# Test 3: Marketplace

A mini buy-and-sell marketplace. Anyone can list an item with a photo, browse listings by category or keyword, open a listing, and message the seller. No login.

**Stack:** Next.js 15 (App Router, TypeScript) · Supabase (Postgres + Storage) · Resend (email) · Vercel
**Design:** based on the Figma "Preloved Secondhand Marketplace" UI kit (light mode).

## Features

- **Create listing** (`/listings/new`): photo, title, description, price, category, seller email
- **Home** (`/`): all listings in a grid, category tabs, keyword search (title + description)
- **Listing detail** (`/listings/[id]`): photo and full details
- **Message Seller**: buyer name, email and message, saved in Supabase
- **Email notification**: the seller gets an email via Resend, sent from a server route. If it fails, the message is still saved.
- Loading skeletons, empty states, error states, responsive and keyboard accessible

## Run it locally

1. Create a Supabase project. In **SQL Editor**, paste all of
   [`supabase/migrations/20261120000000_create_marketplace.sql`](supabase/migrations/20261120000000_create_marketplace.sql) and run it.
2. Copy `.env.example` to `.env.local` and fill it in:

   | Variable | Where to find it | Visible to browser? |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | yes (safe) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API keys → `anon` | yes (safe, RLS protects data) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API keys → `service_role` | **no, server only** |
   | `RESEND_API_KEY` | resend.com → API Keys | **no, server only** |
   | `EMAIL_FROM` | optional, e.g. `Marketplace <hi@yourdomain.com>` | no |

   The last three are only needed for the email bonus. Without them, messages are still saved.
3. `npm install` then `npm run dev`.

> Resend's test sender (`onboarding@resend.dev`) can only email the address you signed up with. To email any seller, verify a domain in Resend and set `EMAIL_FROM`.

## Project structure

```
src/
  app/
    page.tsx                  home: hero, stats, search, tabs, grid
    listings/new/page.tsx     create listing
    listings/[id]/page.tsx    listing detail + Message Seller
    api/messages/route.ts     saves a message, then emails the seller (server only)
  components/                 SiteHeader, Hero, ListingCard, CategoryTabs, SearchBar, CreateListingForm, MessageSeller, ...
  lib/
    supabase.ts               public client (anon key)
    supabase-admin.ts         server-only client (service role), guarded by "server-only"
    listings.ts               fetchListings / fetchListing (public columns only)
    create-listing.ts         validate, upload photo, insert listing
    notify-seller.ts          Resend email (server only)
supabase/migrations/          tables, CHECKs, column grants, RLS, storage bucket
```

## Security and privacy

- **RLS on both tables.** `listings`: anon may `SELECT` and `INSERT` only. `messages`: anon may `INSERT` only. There is no `SELECT` policy, so nobody can read messages through the API.
- **Seller email is private, enforced by the database.** Column-level grants give `anon` SELECT on every listing column *except* `seller_email`. Even `/rest/v1/listings?select=seller_email` (or `select=*`) returns *permission denied*. The app also only ever selects the public columns.
- **Only the server reads the seller email**, using the service role key inside `/api/messages`, to send the notification. `import "server-only"` makes the build fail if that code is ever imported into the browser.
- **CHECK constraints**: title 3–80 chars, description 10–2000, price 0–10,000,000, category in a fixed list, emails must look like `x@y.tld`, photo URL must point at our own bucket.
- **Photos**: public-read bucket, 5 MB limit, image MIME types only, anon can upload but not list, replace or delete. File names are random UUIDs.
- **Search input is sanitized** before it goes into the PostgREST filter, so characters like `, ( ) %` can't change the query.
