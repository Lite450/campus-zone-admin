-- ================================================================
-- Campus Zone — FULL Supabase SQL Schema
-- Run this in Supabase SQL Editor (safe to re-run)
-- ================================================================

create extension if not exists "uuid-ossp";

-- ================================================================
-- 1. APP USERS (Flutter app users — students, teachers, drivers etc.)
-- ================================================================
create table if not exists public.app_users (
  id                     uuid        primary key default uuid_generate_v4(),
  name                   text        not null,
  email                  text        unique not null,
  password               text        not null,
  role                   text        not null check (role in ('student','teacher','driver','non-faculty','admin')),
  is_approved            boolean     default false,
  class_teacher_id       uuid,
  teacher_request_status text        default 'none' check (teacher_request_status in ('none','pending','approved','rejected')),
  home_lat               float       default 0,
  home_lng               float       default 0,
  created_at             timestamptz default now()
);

-- ================================================================
-- 2. CAMPUS USERS (Admin panel login users)
-- ================================================================
create table if not exists public.campus_users (
  id            uuid        primary key default uuid_generate_v4(),
  full_name     text        not null,
  email         text        unique not null,
  password_hash text        not null,
  role          text        not null check (role in ('admin','teacher','student','driver','staff','owner')),
  register_id   text        unique,
  phone         text,
  department    text,
  is_active     boolean     default true,
  created_at    timestamptz default now()
);

-- ================================================================
-- 3. BUSES
-- ================================================================
create table if not exists public.buses (
  id          uuid    primary key default uuid_generate_v4(),
  bus_number  text    unique not null,
  bus_name    text,
  capacity    int     default 40,
  route       text,
  driver_id   uuid    references public.app_users(id) on delete set null,
  is_active   boolean default true
);

-- ================================================================
-- 4. LIVE BUS LOCATION (real-time tracking)
-- ================================================================
create table if not exists public.live_bus_location (
  id           uuid        primary key default uuid_generate_v4(),
  driver_id    uuid        unique not null references public.app_users(id) on delete cascade,
  lat          float       not null default 0,
  lng          float       not null default 0,
  heading      float       default 0,
  speed        float       default 0,
  last_updated timestamptz default now()
);

-- ================================================================
-- 5. TRIPS
-- ================================================================
create table if not exists public.trips (
  id         uuid        primary key default uuid_generate_v4(),
  bus_id     uuid        references public.buses(id),
  driver_id  uuid        references public.app_users(id),
  start_time timestamptz default now(),
  end_time   timestamptz,
  status     text        default 'active' check (status in ('active','completed','cancelled'))
);

-- ================================================================
-- 6. SOS ALERTS
-- ================================================================
create table if not exists public.sos_alerts (
  id         uuid        primary key default uuid_generate_v4(),
  driver_id  uuid        references public.app_users(id),
  message    text,
  lat        float,
  lng        float,
  is_resolved boolean    default false,
  created_at timestamptz default now()
);

-- ================================================================
-- 7. BROADCASTS / ANNOUNCEMENTS
-- ================================================================
create table if not exists public.broadcasts (
  id          uuid        primary key default uuid_generate_v4(),
  title       text        not null,
  message     text        not null,
  target_role text        default 'all',
  priority    text        default 'Normal' check (priority in ('Normal','Important','Urgent')),
  sent_by     uuid,
  created_at  timestamptz default now()
);

-- ================================================================
-- 8. ASSIGNMENTS
-- ================================================================
create table if not exists public.assignments (
  id          uuid        primary key default uuid_generate_v4(),
  teacher_id  uuid        references public.app_users(id),
  title       text        not null,
  description text,
  subject     text,
  due_date    timestamptz,
  created_at  timestamptz default now()
);

-- ================================================================
-- 9. ATTENDANCE RECORDS
-- ================================================================
create table if not exists public.attendance_records (
  id         uuid        primary key default uuid_generate_v4(),
  student_id uuid        references public.app_users(id),
  teacher_id uuid        references public.app_users(id),
  date       date        not null,
  status     text        default 'present' check (status in ('present','absent','late')),
  created_at timestamptz default now()
);

-- ================================================================
-- 10. EXAM SCHEDULES
-- ================================================================
create table if not exists public.exam_schedules (
  id         uuid        primary key default uuid_generate_v4(),
  subject    text        not null,
  exam_date  timestamptz not null,
  venue      text,
  target_class text,
  created_at timestamptz default now()
);

-- ================================================================
-- 11. STUDENT RESULTS
-- ================================================================
create table if not exists public.student_results (
  id          uuid        primary key default uuid_generate_v4(),
  student_id  uuid        references public.app_users(id),
  subject     text        not null,
  exam_type   text,
  obtained    float       default 0,
  max_marks   float       default 100,
  published   boolean     default false,
  created_at  timestamptz default now()
);

-- ================================================================
-- 12. BUS ATTENDANCE
-- ================================================================
create table if not exists public.bus_attendance (
  id         uuid        primary key default uuid_generate_v4(),
  trip_id    uuid        references public.trips(id),
  student_id uuid        references public.app_users(id),
  boarded    boolean     default false,
  created_at timestamptz default now()
);

-- ================================================================
-- ROW LEVEL SECURITY — Allow all ops via service key
-- ================================================================
do $$ declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "allow_all" on public.%I', t);
    execute format('create policy "allow_all" on public.%I using (true) with check (true)', t);
  end loop;
end $$;

-- ================================================================
-- SEED: Default admin user for Admin Panel login
-- ================================================================
insert into public.campus_users (full_name, email, password_hash, role, register_id, is_active)
values ('Campus Admin', 'admin@campuszone.in', 'admin123', 'admin', 'ADM001', true)
on conflict (email) do nothing;

-- ================================================================
-- Done! All tables created. Check Table Editor to verify.
-- ================================================================
