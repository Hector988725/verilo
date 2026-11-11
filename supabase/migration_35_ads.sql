-- ============================================================
-- VERILO: city-wise ads (image / short video up to 15 sec)
-- ============================================================
-- Supabase SQL Editor me ek baar chalao. Dono table sirf server (service role) padhta/likhta hai;
-- browser se seedha access band (RLS on + anon/authenticated revoke).

create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null,
  title text,
  media_type text not null check (media_type in ('image','video')),
  media_url text not null,
  poster_url text,
  link_type text not null default 'none' check (link_type in ('none','whatsapp','call','link')),
  link_value text,
  cities text[] not null default '{}',          -- khali = sab shehar
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  priority int not null default 0,              -- bada number = pehle/zyada baar
  created_at timestamptz not null default now()
);
create index if not exists idx_ads_active on ads(is_active, starts_on, ends_on);

create table if not exists ad_events (
  id bigint generated always as identity primary key,
  ad_id uuid not null references ads(id) on delete cascade,
  event_type text not null check (event_type in ('view','click','unmute')),
  city text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ad_events_ad on ad_events(ad_id, event_type);

alter table ads enable row level security;
alter table ad_events enable row level security;
revoke all on ads from anon, authenticated;
revoke all on ad_events from anon, authenticated;

-- Media bucket: public padhna, 5 MB tak, sirf image/video. Upload sirf admin ke signed URL se.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ad-media', 'ad-media', true, 5242880,
        array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm'];
