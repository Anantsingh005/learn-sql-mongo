-- DBQuiz: Supabase schema (run in Supabase SQL Editor)
-- Tables: profiles, quiz_scores. RLS enforced on both.

-- ------------------------------------------------------------------
-- profiles: one row per auth user, holds the display username.
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (length(username) between 2 and 24),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone can read usernames (needed for the public leaderboard).
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

-- A user can only update their own profile row.
create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------------
-- quiz_scores: one row per completed game.
-- ------------------------------------------------------------------
create table if not exists public.quiz_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game text not null check (game in ('sql', 'mongo')),
  score int not null check (score >= 0),
  time int not null check (time >= 0), -- time taken, in seconds
  created_at timestamptz not null default now()
);

create index if not exists quiz_scores_game_score_idx
  on public.quiz_scores (game, score desc, time asc, created_at desc);

alter table public.quiz_scores enable row level security;

-- Anyone can read scores (public leaderboard).
create policy "scores are publicly readable"
  on public.quiz_scores for select
  using (true);

-- A user can only insert their own scores.
create policy "users insert their own scores"
  on public.quiz_scores for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up.
-- Username defaults to a slug of the email prefix; the user can
-- change it later via an update.
-- ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(split_part(new.email, '@', 1), ''),
      'player_' || substr(new.id::text, 1, 8)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();