-- ============================================================================
-- NEGOTIA — Part 5: MARKETPLACE & COMMUNITY LAUNCHPAD
-- ============================================================================
-- Universal digital marketplace (SALE) + Product-Hunt-style launches (SHOWCASE)
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'listing_kind') then
    create type listing_kind as enum ('SALE', 'SHOWCASE');
  end if;
  if not exists (select 1 from pg_type where typname = 'pricing_model') then
    create type pricing_model as enum ('FIXED', 'SUBSCRIPTION', 'FREE');
  end if;
  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type listing_status as enum ('ACTIVE', 'HIDDEN');
  end if;
end $$;

create table if not exists market_listings (
  id              uuid primary key default uuid_generate_v4(),
  seller_id       uuid not null references users(id) on delete cascade,
  kind            listing_kind not null default 'SHOWCASE',
  title           text not null check (char_length(title) >= 3 and char_length(title) <= 120),
  category        text not null,
  description     text not null check (char_length(description) >= 10),
  tech_stack      jsonb not null default '[]'::jsonb,
  preview_url     text,
  thumbnail_url   text,
  price_cents     integer check (price_cents is null or price_cents >= 0),
  currency        text not null default 'USD' check (currency in ('USD', 'INR')),
  pricing_model   pricing_model not null default 'FREE',
  delivery_url    text,
  status          listing_status not null default 'ACTIVE',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint sale_requires_price check (
    (kind = 'SALE' and price_cents is not null and price_cents > 0)
    or (kind = 'SHOWCASE')
  )
);

create table if not exists marketplace_purchases (
  id              uuid primary key default uuid_generate_v4(),
  listing_id      uuid not null references market_listings(id) on delete cascade,
  buyer_id        uuid not null references users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  constraint unique_purchase unique (listing_id, buyer_id)
);

create table if not exists launch_ratings (
  id              uuid primary key default uuid_generate_v4(),
  listing_id      uuid not null references market_listings(id) on delete cascade,
  rater_id        uuid not null references users(id) on delete cascade,
  rating          integer not null check (rating >= 1 and rating <= 5),
  review          text check (review is null or char_length(review) between 1 and 2000),
  created_at      timestamptz not null default now(),
  constraint unique_rating_per_listing unique (listing_id, rater_id)
);

create index if not exists idx_market_listings_kind_status on market_listings (kind, status, created_at desc);
create index if not exists idx_market_listings_category on market_listings (category);
create index if not exists idx_market_listings_seller on market_listings (seller_id);
create index if not exists idx_market_purchases_buyer on marketplace_purchases (buyer_id);
create index if not exists idx_launch_ratings_listing on launch_ratings (listing_id);

-- ============================================================================
-- RLS
-- ============================================================================
alter table market_listings enable row level security;
alter table marketplace_purchases enable row level security;
alter table launch_ratings enable row level security;

-- Listings: public read (ACTIVE only), sellers manage their own
drop policy if exists "Listings: Public read active" on market_listings;
create policy "Listings: Public read active" on market_listings
  for select using (status = 'ACTIVE' or seller_id = auth.uid());

drop policy if exists "Listings: Insert own" on market_listings;
create policy "Listings: Insert own" on market_listings
  for insert with check (seller_id = auth.uid());

drop policy if exists "Listings: Update own" on market_listings;
create policy "Listings: Update own" on market_listings
  for update using (seller_id = auth.uid()) with check (seller_id = auth.uid());

drop policy if exists "Listings: Delete own" on market_listings;
create policy "Listings: Delete own" on market_listings
  for delete using (seller_id = auth.uid());

-- Purchases: buyer reads own, sellers read their listings' purchases
drop policy if exists "Purchases: Read own" on marketplace_purchases;
create policy "Purchases: Read own" on marketplace_purchases
  for select using (
    buyer_id = auth.uid()
    or exists (select 1 from market_listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

drop policy if exists "Purchases: Insert own" on marketplace_purchases;
create policy "Purchases: Insert own" on marketplace_purchases
  for insert with check (buyer_id = auth.uid());

-- Ratings: public read, users rate once (insert own, update/delete own)
drop policy if exists "Ratings: Public read" on launch_ratings;
create policy "Ratings: Public read" on launch_ratings for select using (true);

drop policy if exists "Ratings: Insert own" on launch_ratings;
create policy "Ratings: Insert own" on launch_ratings
  for insert with check (rater_id = auth.uid());

drop policy if exists "Ratings: Update own" on launch_ratings;
create policy "Ratings: Update own" on launch_ratings
  for update using (rater_id = auth.uid()) with check (rater_id = auth.uid());

drop policy if exists "Ratings: Delete own" on launch_ratings;
create policy "Ratings: Delete own" on launch_ratings
  for delete using (rater_id = auth.uid());

-- ============================================================================
-- VIEWS
-- ============================================================================

create or replace view public.marketplace_feed as
select l.id, l.seller_id, l.kind, l.title, l.category, l.description,
  l.tech_stack, l.preview_url, l.thumbnail_url, l.price_cents, l.currency,
  l.pricing_model, l.status, l.created_at,
  u.name as seller_name, u.avatar_url as seller_avatar, u.username as seller_username,
  coalesce((select avg(r.rating) from launch_ratings r where r.listing_id = l.id), 0)::numeric(3,2) as avg_rating,
  (select count(*) from launch_ratings r where r.listing_id = l.id) as rating_count,
  (select count(*) from marketplace_purchases p where p.listing_id = l.id) as purchase_count
from market_listings l
join users u on u.id = l.seller_id
where l.status = 'ACTIVE'
order by l.created_at desc;

create or replace view public.launch_leaderboard as
select l.id, l.seller_id, l.kind, l.title, l.category, l.description,
  l.tech_stack, l.preview_url, l.thumbnail_url, l.pricing_model, l.created_at,
  u.name as seller_name, u.avatar_url as seller_avatar,
  coalesce((select avg(r.rating) from launch_ratings r where r.listing_id = l.id), 0)::numeric(3,2) as avg_rating,
  (select count(*) from launch_ratings r where r.listing_id = l.id) as rating_count,
  (select count(*) from marketplace_purchases p where p.listing_id = l.id) as purchase_count
from market_listings l
join users u on u.id = l.seller_id
where l.status = 'ACTIVE' and l.kind = 'SHOWCASE'
  and exists (select 1 from launch_ratings r where r.listing_id = l.id)
order by avg_rating desc, rating_count desc, l.created_at desc;

-- Part 5 done.
