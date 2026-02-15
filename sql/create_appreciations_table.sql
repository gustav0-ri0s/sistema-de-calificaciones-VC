-- Create table for student appreciations (Tutor comments per bimestre)
create table if not exists public.student_appreciations (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) not null,
  bimestre_id int references public.bimestres(id) not null,
  tutor_id uuid references public.profiles(id), -- Who wrote the appreciation
  comment text,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, bimestre_id)
);

-- Enable RLS
alter table public.student_appreciations enable row level security;

-- Policies
-- 1. Supervisors and Admins can view all
create policy "Supervisors and Admins can view all appreciations"
  on public.student_appreciations for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('supervisor', 'admin', 'subdirector')
    )
  );

-- 2. Tutors can view their own students' appreciations
create policy "Tutors can view their students appreciations"
  on public.student_appreciations for select
  using (
    exists (
      select 1 from public.students s
      join public.classrooms c on s.classroom_id = c.id
      join public.profiles p on p.tutor_classroom_id = c.id
      where s.id = student_appreciations.student_id
      and p.id = auth.uid()
    )
  );

-- 3. Tutors can insert/update their students' appreciations
create policy "Tutors can insert/update their students appreciations"
  on public.student_appreciations for insert
  with check (
    exists (
      select 1 from public.students s
      join public.classrooms c on s.classroom_id = c.id
      join public.profiles p on p.tutor_classroom_id = c.id
      where s.id = student_id
      and p.id = auth.uid()
    )
  );

create policy "Tutors can update their students appreciations"
  on public.student_appreciations for update
  using (
    exists (
      select 1 from public.students s
      join public.classrooms c on s.classroom_id = c.id
      join public.profiles p on p.tutor_classroom_id = c.id
      where s.id = student_appreciations.student_id
      and p.id = auth.uid()
    )
  );

-- 4. Supervisors/Admins can update (approve/edit)
create policy "Supervisors/Admins can update appreciations"
  on public.student_appreciations for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('supervisor', 'admin', 'subdirector')
    )
  );

-- Create table for Tutor assignments (Behavior/Values Grades)
create table if not exists public.student_behavior_grades (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) not null,
  bimestre_id int references public.bimestres(id) not null,
  behavior_grade text check (behavior_grade in ('AD', 'A', 'B', 'C', '')),
  values_grade text check (values_grade in ('AD', 'A', 'B', 'C', '')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, bimestre_id)
);

-- RLS for behavior grades (similar to appreciations)
alter table public.student_behavior_grades enable row level security;

create policy "Staff can view behavior grades"
  on public.student_behavior_grades for select
  using (true); -- Simplified for read access

create policy "Tutors can manage behavior grades"
  on public.student_behavior_grades for all
  using (
    exists (
      select 1 from public.students s
      join public.classrooms c on s.classroom_id = c.id
      join public.profiles p on p.tutor_classroom_id = c.id
      where s.id = student_behavior_grades.student_id
      and p.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      join public.classrooms c on s.classroom_id = c.id
      join public.profiles p on p.tutor_classroom_id = c.id
      where s.id = student_id
      and p.id = auth.uid()
    )
  );
