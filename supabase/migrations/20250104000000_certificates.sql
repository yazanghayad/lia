create table if not exists public.certificates (
  id uuid default gen_random_uuid() primary key,
  internship_id uuid not null references public.internships(id) on delete cascade,
  student_id uuid not null references auth.users(id),
  company_id uuid not null,
  issued_at timestamptz not null default now(),
  certificate_number text not null unique,
  student_name text not null,
  company_name text not null,
  school_name text,
  internship_title text not null,
  start_date date not null,
  end_date date not null,
  goals_achieved text[] not null default '{}',
  total_days_attended integer not null default 0,
  attendance_rate numeric(5,2) not null default 0,
  verification_hash text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create unique index idx_certificates_internship on public.certificates(internship_id);
create index idx_certificates_student on public.certificates(student_id);
create index idx_certificates_verification on public.certificates(certificate_number, verification_hash);

alter table public.certificates enable row level security;

create policy "Students can view own certificates"
  on public.certificates for select
  using (auth.uid() = student_id);

create policy "Supervisors can view certificates for their internships"
  on public.certificates for select
  using (
    exists (
      select 1 from public.internships
      where internships.id = internship_id
        and internships.supervisor_id = auth.uid()
    )
  );

create policy "Admins can view all certificates"
  on public.certificates for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "System can insert certificates"
  on public.certificates for insert
  with check (true);
