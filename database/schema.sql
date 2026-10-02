create extension if not exists "uuid-ossp";

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz default now()
);

create table organization_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('admin','employee')) default 'employee',
  joined_at timestamptz default now(),
  unique(organization_id, user_id)
);

create table office_locations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  name text default 'Main Office',
  latitude double precision not null,
  longitude double precision not null,
  radius_meters int default 100,
  created_at timestamptz default now()
);

create table attendance_days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  day date not null,
  status text check (status in ('present','absent','leave','holiday')) default 'present',
  total_office_minutes int default 0,
  outside_minutes   int default 0,
  balance_minutes   int default 0,
  notes text,
  updated_at timestamptz default now(),
  unique(user_id, day)
);

create table attendance_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  day date not null,
  check_in  timestamptz not null,
  check_out timestamptz,
  duration_minutes int,
  source text default 'gps' check (source in ('gps','manual')),
  created_at timestamptz default now()
);

create table attendance_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  session_id uuid references attendance_sessions(id) on delete cascade,
  event_type text check (event_type in ('in','out','outside_start','outside_end')),
  event_time timestamptz default now(),
  latitude double precision,
  longitude double precision,
  inside_geofence boolean,
  created_at timestamptz default now()
);

create table leave_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  type text check (type in ('leave','sick','absent','holiday')) default 'leave',
  reason text,
  approved boolean default false,
  created_at timestamptz default now()
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  actor_id uuid references profiles(id),
  table_name text,
  record_id uuid,
  field text,
  old_value text,
  new_value text,
  changed_at timestamptz default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
