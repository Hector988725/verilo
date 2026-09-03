-- Run this entire file in Supabase Dashboard -> SQL Editor -> New Query -> Run

create extension if not exists "uuid-ossp";

-- Cities/areas
create table cities (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Listings (professionals: plumber, doctor, tuition, etc.)
create table listings (
  id uuid primary key default uuid_generate_v4(),
  city_id uuid references cities(id) on delete cascade,
  name text not null,
  service text not null check (service in ('doctor','plumber','electrician','mistri','tuition','milk-veg','other')),
  qualification text,
  experience text,
  about text,
  phone text not null,
  area text,
  note text,
  photo_url text,
  verified boolean default false,
  joined_at timestamptz default now(),
  trial_ends_at timestamptz default (now() + interval '15 days'),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Ratings/reviews
create table ratings (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  review_text text,
  created_at timestamptz default now()
);

-- Payment/subscription records (Razorpay)
create table payments (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_paise int not null,
  status text default 'created' check (status in ('created','paid','failed')),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now()
);

-- Reports/complaints (for trust & safety)
create table reports (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now()
);

-- Indexes for speed
create index idx_listings_city on listings(city_id);
create index idx_listings_service on listings(service);
create index idx_ratings_listing on ratings(listing_id);
create index idx_payments_listing on payments(listing_id);

-- Row Level Security: allow public read, restrict writes to service role (via API routes)
alter table cities enable row level security;
alter table listings enable row level security;
alter table ratings enable row level security;
alter table payments enable row level security;
alter table reports enable row level security;

create policy "public read cities" on cities for select using (true);
create policy "public read listings" on listings for select using (true);
create policy "public read ratings" on ratings for select using (true);

create policy "public insert cities" on cities for insert with check (true);
create policy "public insert listings" on listings for insert with check (true);
create policy "public insert ratings" on ratings for insert with check (true);
create policy "public insert reports" on reports for insert with check (true);

-- payments table: no public policies (only service role via API can write/read)
