-- Allow Supervisors and Admins to INSERT appreciations (for upsert operations)
create policy "Supervisors/Admins can insert appreciations"
  on public.student_appreciations for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('supervisor', 'admin', 'subdirector')
    )
  );

-- Also ensure they can Insert behavior grades if needed
create policy "Staff can insert behavior grades"
  on public.student_behavior_grades for insert
  with check (
     exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('supervisor', 'admin', 'subdirector')
    )
  );

create policy "Staff can update behavior grades"
  on public.student_behavior_grades for update
  using (
     exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('supervisor', 'admin', 'subdirector')
    )
  );
