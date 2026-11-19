-- Test 3: Marketplace
-- Run this whole file once in the Supabase SQL editor.
-- It creates the listings and messages tables, locks them down with RLS,
-- keeps the seller's email private, and creates the photo bucket.

-- ============================================================
-- 1. Tables
-- ============================================================
create table if not exists public.listings (
  id           uuid          primary key default gen_random_uuid(),
  title        text          not null check (char_length(btrim(title)) between 3 and 80),
  description  text          not null check (char_length(btrim(description)) between 10 and 2000),
  price        numeric(10,2) not null check (price >= 0 and price <= 10000000),
  category     text          not null check (category in
                 ('clothing', 'bags', 'shoes', 'electronics', 'home', 'other')),
  image_url    text          not null
                 check (image_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/listing-photos/'),
  -- PRIVATE: never readable by the public (see column grants below).
  seller_email text          not null
                 check (char_length(seller_email) <= 254
                        and seller_email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  created_at   timestamptz   not null default now()
);

create table if not exists public.messages (
  id          uuid        primary key default gen_random_uuid(),
  listing_id  uuid        not null references public.listings (id) on delete cascade,
  buyer_name  text        not null check (char_length(btrim(buyer_name)) between 1 and 80),
  buyer_email text        not null
                check (char_length(buyer_email) <= 254
                       and buyer_email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  body        text        not null check (char_length(btrim(body)) between 1 and 1000),
  created_at  timestamptz not null default now()
);

-- The home page sorts newest first and filters by category.
create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_category_idx   on public.listings (category, created_at desc);
create index if not exists messages_listing_id_idx on public.messages (listing_id);

-- ============================================================
-- 2. Keep the seller's email private (column-level privileges)
-- RLS decides WHICH ROWS a role can see. Column grants decide WHICH
-- COLUMNS. We give the public roles SELECT on every column EXCEPT
-- seller_email, so even a hand-written API call like
--   /rest/v1/listings?select=seller_email
-- fails with "permission denied". Hiding it in the UI is not enough.
-- ============================================================
revoke all on public.listings from anon, authenticated;
grant select (id, title, description, price, category, image_url, created_at)
  on public.listings to anon, authenticated;
grant insert (title, description, price, category, image_url, seller_email)
  on public.listings to anon, authenticated;

-- Messages: the public can only INSERT. No SELECT privilege at all.
revoke all on public.messages from anon, authenticated;
grant insert (listing_id, buyer_name, buyer_email, body)
  on public.messages to anon, authenticated;

-- ============================================================
-- 3. Row Level Security
-- With RLS on, everything is denied unless a policy allows it.
-- ============================================================
alter table public.listings enable row level security;
alter table public.messages enable row level security;

-- listings: anyone can browse and create. No UPDATE or DELETE policy,
-- so nobody can edit or remove someone else's listing.
drop policy if exists "Anyone can view listings" on public.listings;
create policy "Anyone can view listings"
  on public.listings for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can create listings" on public.listings;
create policy "Anyone can create listings"
  on public.listings for insert
  to anon, authenticated
  with check (true); -- the CHECK constraints above validate the values

-- messages: INSERT only. There is deliberately NO select policy,
-- so nobody can read other people's messages through the API.
-- Only the server (service role, which bypasses RLS) can read them.
drop policy if exists "Anyone can send a message" on public.messages;
create policy "Anyone can send a message"
  on public.messages for insert
  to anon, authenticated
  with check (true);

-- ============================================================
-- 4. Listing photo storage
-- Public bucket = anyone with the URL can view a photo (public read).
-- The bucket itself rejects files over 5 MB or that are not images.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upload only, with an image extension. No SELECT policy (nobody can
-- list every file) and no UPDATE/DELETE (nobody can replace a photo).
-- File names are random UUIDs generated by the app.
drop policy if exists "Anyone can upload listing photos" on storage.objects;
create policy "Anyone can upload listing photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'listing-photos'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'gif', 'webp')
  );
