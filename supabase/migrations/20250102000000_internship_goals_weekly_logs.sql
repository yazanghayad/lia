-- Internship goals table
create table if not exists public.internship_goals (
  id uuid default gen_random_uuid() primary key,
  internship_id uuid not null references public.internships(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_internship_goals_internship on public.internship_goals(internship_id);

-- Weekly logs table
create table if not exists public.weekly_logs (
  id uuid default gen_random_uuid() primary key,
  internship_id uuid not null references public.internships(id) on delete cascade,
  student_id uuid not null references auth.users(id),
  goal_id uuid not null references public.internship_goals(id) on delete cascade,
  week_number integer not null check (week_number >= 1),
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  supervisor_comment text,
  commented_by uuid references auth.users(id),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_weekly_logs_internship on public.weekly_logs(internship_id);
create index idx_weekly_logs_goal on public.weekly_logs(goal_id);
create unique index idx_weekly_logs_unique_entry on public.weekly_logs(internship_id, goal_id, week_number);

-- Enable RLS
alter table public.internship_goals enable row level security;
alter table public.weekly_logs enable row level security;

-- Goals: supervisors can manage goals for their internships
create policy "Supervisors can insert goals"
  on public.internship_goals for insert
  with check (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

create policy "Supervisors can update goals"
  on public.internship_goals for update
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

create policy "Supervisors can delete goals"
  on public.internship_goals for delete
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
    and not exists (
      select 1 from public.weekly_logs
      where weekly_logs.goal_id = internship_goals.id
        and weekly_logs.status = 'approved'
    )
  );

-- Goals: visible to supervisor, student, school, admin
create policy "Supervisors can view goals"
  on public.internship_goals for select
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

create policy "Students can view goals for their internships"
  on public.internship_goals for select
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.student_id = auth.uid()
    )
  );

create policy "Admins can view all goals"
  on public.internship_goals for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Weekly logs: students can insert/update their own drafts
create policy "Students can insert logs"
  on public.weekly_logs for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.student_id = auth.uid()
    )
  );

create policy "Students can update draft logs"
  on public.weekly_logs for update
  using (
    auth.uid() = student_id
    and status = 'draft'
  )
  with check (
    auth.uid() = student_id
  );

-- Supervisors can update logs (for approval/comments)
create policy "Supervisors can update logs for approval"
  on public.weekly_logs for update
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

-- Logs: visible to supervisor, student, admin
create policy "Students can view own logs"
  on public.weekly_logs for select
  using (auth.uid() = student_id);

create policy "Supervisors can view logs"
  on public.weekly_logs for select
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

create policy "Admins can view all logs"
  on public.weekly_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Students can delete only draft logs
create policy "Students can delete draft logs"
  on public.weekly_logs for delete
  using (
    auth.uid() = student_id
    and status = 'draft'
  );

-- updated_at triggers
create or replace function public.handle_goals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_internship_goals_updated
  before update on public.internship_goals
  for each row execute function public.handle_goals_updated_at();

create or replace function public.handle_weekly_logs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  -- Prevent changes to approved logs (except by trigger itself)
  if old.status = 'approved' and new.status = 'approved' then
    raise exception 'Cannot modify an approved log entry';
  end if;
  -- Auto-set timestamps
  if new.status = 'submitted' and old.status = 'draft' then
    new.submitted_at = now();
  end if;
  if new.status = 'approved' and old.status != 'approved' then
    new.approved_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_weekly_logs_updated
  before update on public.weekly_logs
  for each row execute function public.handle_weekly_logs_updated_at();
