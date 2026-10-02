alter table organizations         enable row level security;
alter table profiles              enable row level security;
alter table organization_members  enable row level security;
alter table office_locations      enable row level security;
alter table attendance_days       enable row level security;
alter table attendance_sessions   enable row level security;
alter table attendance_events     enable row level security;
alter table leave_records         enable row level security;
alter table audit_logs            enable row level security;

create or replace function is_admin(org_id uuid)
returns boolean language sql security definer as $$
  select exists(
    select 1 from organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function is_member(org_id uuid)
returns boolean language sql security definer as $$
  select exists(
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create policy "profile self read" on profiles for select using (id = auth.uid());
create policy "profile self update" on profiles for update using (id = auth.uid());
create policy "profile admin read" on profiles for select using (
  exists (
    select 1 from organization_members m1
    join organization_members m2 on m1.organization_id = m2.organization_id
    where m1.user_id = profiles.id
      and m2.user_id = auth.uid()
      and m2.role = 'admin'
  )
);

create policy "org member read" on organizations for select using (is_member(id));
create policy "org admin write" on organizations for all using (is_admin(id));

create policy "member self read" on organization_members for select
  using (user_id = auth.uid() or is_admin(organization_id));
create policy "member admin write" on organization_members for all
  using (is_admin(organization_id));

create policy "loc member read" on office_locations for select using (is_member(organization_id));
create policy "loc admin write" on office_locations for all using (is_admin(organization_id));

create policy "day owner all" on attendance_days for all using (user_id = auth.uid());
create policy "day admin read" on attendance_days for select using (is_admin(organization_id));

create policy "session owner all" on attendance_sessions for all using (user_id = auth.uid());
create policy "session admin read" on attendance_sessions for select using (
  exists(
    select 1 from attendance_days d
    where d.user_id = attendance_sessions.user_id
      and d.day = attendance_sessions.day
      and is_admin(d.organization_id)
  )
);

create policy "event owner all" on attendance_events for all using (user_id = auth.uid());

create policy "leave owner all" on leave_records for all using (user_id = auth.uid());

create policy "audit admin read" on audit_logs for select using (
  exists (
    select 1 from profiles p
    join organization_members m on m.user_id = p.id
    where p.id = audit_logs.user_id and m.role = 'admin' and m.user_id = auth.uid()
  )
);
create policy "audit insert self" on audit_logs for insert with check (actor_id = auth.uid());
