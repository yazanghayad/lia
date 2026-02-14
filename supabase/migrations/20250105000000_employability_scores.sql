create table if not exists public.employability_scores (
  id uuid default gen_random_uuid() primary key,
  student_id uuid not null references auth.users(id) on delete cascade,
  overall_score numeric(5,2) not null default 0,
  internship_score numeric(5,2) not null default 0,
  feedback_score numeric(5,2) not null default 0,
  skill_score numeric(5,2) not null default 0,
  attendance_score numeric(5,2) not null default 0,
  goal_score numeric(5,2) not null default 0,
  breakdown jsonb not null default '{}',
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_employability_student on public.employability_scores(student_id);

alter table public.employability_scores enable row level security;

create policy "Students can view own score"
  on public.employability_scores for select
  using (auth.uid() = student_id);

create policy "Supervisors can view scores of their interns"
  on public.employability_scores for select
  using (
    exists (
      select 1 from public.internships
      where internships.student_id = employability_scores.student_id
        and internships.supervisor_id = auth.uid()
    )
  );

create policy "Admins can view all scores"
  on public.employability_scores for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Only server/API can insert/update (service role)
create policy "System can upsert scores"
  on public.employability_scores for all
  using (true)
  with check (true);

create or replace function public.handle_employability_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_employability_updated
  before update on public.employability_scores
  for each row execute function public.handle_employability_updated_at();
