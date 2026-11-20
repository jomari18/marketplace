-- Test 4: Stripe Connect
-- Run this whole file once in the Supabase SQL editor, AFTER the Test 3 migration.
-- It adds sellers (connected Stripe accounts), orders, and a sold status on listings.
-- The public (anon) can read NEITHER sellers NOR orders; only the server writes them.

-- ============================================================
-- 1. Listing status: available -> sold
-- ============================================================
alter table public.listings
  add column if not exists status text not null default 'available'
    check (status in ('available', 'sold'));

-- The public may SEE the status (to show a "Sold" badge) but not change it.
-- Anon's INSERT grant (from Test 3) doesn't include status, so new listings
-- always start as 'available'.
grant select (status) on public.listings to anon, authenticated;

-- Only the server marks a listing as sold (from the Stripe webhook).
grant update (status) on public.listings to service_role;

-- ============================================================
-- 2. Sellers: one connected Stripe account per seller email
-- A listing "belongs" to a seller when listings.seller_email = sellers.email.
-- ============================================================
create table if not exists public.sellers (
  email             text        primary key
                      check (email = lower(email)
                             and char_length(email) <= 254
                             and email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  stripe_account_id text        not null unique check (stripe_account_id ~ '^acct_[A-Za-z0-9]+$'),
  charges_enabled   boolean     not null default false, -- updated by the account.updated webhook
  details_submitted boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- 3. Orders: one row per paid Checkout Session
-- ============================================================
create table if not exists public.orders (
  id                     uuid        primary key default gen_random_uuid(),
  listing_id             uuid        not null references public.listings (id) on delete restrict,
  stripe_account_id      text        not null,
  -- UNIQUE makes the webhook idempotent: the same event twice can't create two orders.
  checkout_session_id    text        not null unique,
  payment_intent_id      text,
  amount_total           integer     not null check (amount_total > 0),   -- smallest unit (e.g. centavos)
  application_fee_amount integer     not null check (application_fee_amount >= 0),
  currency               text        not null check (currency ~ '^[a-z]{3}$'),
  buyer_email            text,
  created_at             timestamptz not null default now()
);

-- A listing can only be sold once.
create unique index if not exists orders_listing_id_key on public.orders (listing_id);

-- ============================================================
-- 4. Lock both tables down
-- RLS on, no policies for anon/authenticated = no access at all.
-- The service role (server only) bypasses RLS but still needs grants.
-- ============================================================
alter table public.sellers enable row level security;
alter table public.orders  enable row level security;

revoke all on public.sellers from anon, authenticated;
revoke all on public.orders  from anon, authenticated;

grant select, insert, update on public.sellers to service_role;
grant select, insert         on public.orders  to service_role;
