-- Attendance records
create table if not exists public.attendance_records (
  id uuid default gen_random_uuid() primary key,
  internship_id uuid not null references public.internships(id) on delete cascade,
  student_id uuid not null references auth.users(id),
  date date not null,
  status text not null check (status in ('present', 'absent', 'remote')),
  note text,
  submitted_at timestamptz not null default now(),
  approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_attendance_unique_day on public.attendance_records(internship_id, student_id, date);
create index idx_attendance_internship on public.attendance_records(internship_id);
create index idx_attendance_date on public.attendance_records(date);

-- Correction / edit history table
create table if not exists public.attendance_corrections (
  id uuid default gen_random_uuid() primary key,
  attendance_id uuid not null references public.attendance_records(id) on delete cascade,
  corrected_by uuid not null references auth.users(id),
  previous_status text not null,
  new_status text not null,
  previous_note text,
  new_note text,
  reason text not null,
  created_at timestamptz not null default now()
);

create index idx_corrections_attendance on public.attendance_corrections(attendance_id);

-- Enable RLS
alter table public.attendance_records enable row level security;
alter table public.attendance_corrections enable row level security;

-- Students can insert their own attendance
create policy "Students can insert own attendance"
  on public.attendance_records for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.student_id = auth.uid()
    )
  );

-- Students can update their own unapproved attendance
create policy "Students can update own unapproved attendance"
  on public.attendance_records for update
  using (auth.uid() = student_id and approved = false)
  with check (auth.uid() = student_id);

-- Students can view own attendance
create policy "Students can view own attendance"
  on public.attendance_records for select
  using (auth.uid() = student_id);

-- Supervisors can view attendance for their internships
create policy "Supervisors can view attendance"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

-- Supervisors can update attendance for approval/correction
create policy "Supervisors can update attendance"
  on public.attendance_records for update
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

-- Admins can view all attendance
create policy "Admins can view all attendance"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Corrections: supervisors can insert
create policy "Supervisors can insert corrections"
  on public.attendance_corrections for insert
  with check (
    exists (
      select 1 from public.attendance_records
        join public.internships on internships.id = attendance_records.internship_id
      where attendance_records.id = attendance_id
        and internships.supervisor_id = auth.uid()
    )
  );

-- Corrections: visible to supervisor, student, admin
create policy "Students can view corrections on own attendance"
  on public.attendance_corrections for select
  using (
    exists (
      select 1 from public.attendance_records
      where attendance_records.id = attendance_id
        and attendance_records.student_id = auth.uid()
    )
  );

create policy "Supervisors can view corrections"
  on public.attendance_corrections for select
  using (
    exists (
      select 1 from public.attendance_records
        join public.internships on internships.id = attendance_records.internship_id
      where attendance_records.id = attendance_id
        and internships.supervisor_id = auth.uid()
    )
  );

create policy "Admins can view all corrections"
  on public.attendance_corrections for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- updated_at trigger
create or replace function public.handle_attendance_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_attendance_updated
  before update on public.attendance_records
  for each row execute function public.handle_attendance_updated_at();
