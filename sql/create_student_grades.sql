-- Create student_grades table
create table if not exists public.student_grades (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  competency_id bigint references public.competencies(id) on delete cascade not null,
  bimestre_id bigint references public.bimestres(id) on delete cascade not null,
  grade text check (grade in ('AD', 'A', 'B', 'C')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, competency_id, bimestre_id)
);

-- Enable RLS
alter table public.student_grades enable row level security;

-- Policies
-- 1. Read access for authenticated users (Staff and Teachers need to see grades)
create policy "Authenticated users can read grades"
  on public.student_grades for select
  to authenticated
  using (true);

-- 2. Insert/Update for Teachers, Supervisors, Admins
create policy "Authorized users can insert grades"
  on public.student_grades for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('docente', 'supervisor', 'admin', 'subdirector')
    )
  );

create policy "Authorized users can update grades"
  on public.student_grades for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('docente', 'supervisor', 'admin', 'subdirector')
    )
  );

-- 3. Delete? Maybe allow deletion too.
create policy "Authorized users can delete grades"
  on public.student_grades for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('docente', 'supervisor', 'admin', 'subdirector')
    )
  );
