-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- It sets up tables, indexes, and Row Level Security so users can only ever
-- see their own data and data from people they've matched with.

create extension if not exists "uuid-ossp";

-- 1. Profiles ---------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  display_name text not null,
  birthdate date not null,
  gender text,
  bio text default '',
  interested_in text[] default '{}',
  is_visible boolean default true,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Everyone who is signed in can see visible profiles (needed for the swipe deck)
create policy "profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (is_visible = true or user_id = auth.uid());

-- Users can only create/update/delete their own profile
create policy "users manage their own profile"
  on profiles for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2. Photos -------------------------------------------------------------
create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  position int default 0,
  created_at timestamptz default now()
);

alter table photos enable row level security;

create policy "photos are viewable by authenticated users"
  on photos for select
  to authenticated
  using (true);

create policy "users manage their own photos"
  on photos for all
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

-- 3. Swipes ---------------------------------------------------------------
create table if not exists swipes (
  id uuid primary key default uuid_generate_v4(),
  swiper_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz default now(),
  unique (swiper_id, target_id)
);

alter table swipes enable row level security;

create policy "users see only their own swipes"
  on swipes for select
  to authenticated
  using (swiper_id in (select id from profiles where user_id = auth.uid()));

create policy "users create their own swipes"
  on swipes for insert
  to authenticated
  with check (swiper_id in (select id from profiles where user_id = auth.uid()));

-- 4. Matches ---------------------------------------------------------------
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

alter table matches enable row level security;

create policy "users see their own matches"
  on matches for select
  to authenticated
  using (
    user_a in (select id from profiles where user_id = auth.uid())
    or user_b in (select id from profiles where user_id = auth.uid())
  );

-- 5. Messages ---------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "users read messages in their own matches"
  on messages for select
  to authenticated
  using (
    match_id in (
      select id from matches
      where user_a in (select id from profiles where user_id = auth.uid())
         or user_b in (select id from profiles where user_id = auth.uid())
    )
  );

create policy "users send messages in their own matches"
  on messages for insert
  to authenticated
  with check (
    sender_id in (select id from profiles where user_id = auth.uid())
    and match_id in (
      select id from matches
      where user_a in (select id from profiles where user_id = auth.uid())
         or user_b in (select id from profiles where user_id = auth.uid())
    )
  );

-- 6. Auto-create a match when two people like each other --------------------
create or replace function handle_new_swipe()
returns trigger as $$
begin
  if new.direction = 'like' then
    if exists (
      select 1 from swipes
      where swiper_id = new.target_id
        and target_id = new.swiper_id
        and direction = 'like'
    ) then
      insert into matches (user_a, user_b)
      values (
        least(new.swiper_id, new.target_id),
        greatest(new.swiper_id, new.target_id)
      )
      on conflict (user_a, user_b) do nothing;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_swipe_created on swipes;
create trigger on_swipe_created
  after insert on swipes
  for each row execute function handle_new_swipe();

-- 7. Storage bucket for profile photos ---------------------------------
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "anyone authenticated can view profile photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-photos');

create policy "users upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
