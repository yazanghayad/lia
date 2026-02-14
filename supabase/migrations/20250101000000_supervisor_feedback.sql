-- Supervisor feedback table
create table if not exists public.supervisor_feedback (
  id uuid default gen_random_uuid() primary key,
  internship_id uuid not null references public.internships(id) on delete cascade,
  supervisor_id uuid not null references auth.users(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('weekly', 'mid_term', 'final')),
  rating integer not null check (rating >= 1 and rating <= 5),
  content text not null,
  visible_to_school boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookup by internship
create index idx_supervisor_feedback_internship on public.supervisor_feedback(internship_id);
create index idx_supervisor_feedback_supervisor on public.supervisor_feedback(supervisor_id);

-- Enable RLS
alter table public.supervisor_feedback enable row level security;

-- Supervisors can insert feedback for their internships
create policy "Supervisors can insert own feedback"
  on public.supervisor_feedback for insert
  with check (
    auth.uid() = supervisor_id
    and exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

-- Supervisors can update their own feedback
create policy "Supervisors can update own feedback"
  on public.supervisor_feedback for update
  using (auth.uid() = supervisor_id)
  with check (auth.uid() = supervisor_id);

-- Supervisors can view their own feedback
create policy "Supervisors can view own feedback"
  on public.supervisor_feedback for select
  using (auth.uid() = supervisor_id);

-- Students can view feedback on their internships
create policy "Students can view feedback on their internships"
  on public.supervisor_feedback for select
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.student_id = auth.uid()
    )
  );

-- School users can view feedback marked visible_to_school
create policy "School can view shared feedback"
  on public.supervisor_feedback for select
  using (
    visible_to_school = true
    and exists (
      select 1 from public.internships
        join public.students on students.id = internships.student_id
      where internships.id = internship_id
        and students.school_id = (
          select school_id from public.school_staff where user_id = auth.uid()
        )
    )
  );

-- Admins can view all feedback
create policy "Admins can view all feedback"
  on public.supervisor_feedback for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Trigger for updated_at
create or replace function public.handle_supervisor_feedback_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$ language plpgsql;

create trigger on_supervisor_feedback_updated
  before update on public.supervisor_feedback
  for each row
  execute function public.handle_supervisor_feedback_updated_at();
