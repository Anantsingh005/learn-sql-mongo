-- Create feedback table for user feedback submissions
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster queries
create index feedback_user_id_idx on public.feedback(user_id);
create index feedback_status_idx on public.feedback(status);
create index feedback_created_at_idx on public.feedback(created_at desc);

-- Enable RLS
alter table public.feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can insert own feedback" on public.feedback
  for insert with check (auth.uid() = user_id);

-- Users can view their own feedback
create policy "Users can view own feedback" on public.feedback
  for select using (auth.uid() = user_id);

-- Admins can view all feedback (check admins table)
create policy "Admins can view all feedback" on public.feedback
  for select using (
    exists (
      select 1 from public.admins
      where user_id = auth.uid()
    )
  );

-- Admins can update feedback status
create policy "Admins can update feedback" on public.feedback
  for update using (
    exists (
      select 1 from public.admins
      where user_id = auth.uid()
    )
  );

-- Updated_at trigger (uses existing handle_updated_at function)
create trigger handle_feedback_updated_at
  before update on public.feedback
  for each row execute function public.handle_updated_at();