-- ========================================================
-- Fitness & Meal Planner — Supabase schema (v2: multi-user)
--
-- ใช้ไฟล์นี้สำหรับ "โปรเจกต์ Supabase ใหม่" เท่านั้น
-- ถ้าคุณเคยรัน schema เวอร์ชันแรก (แบบคนเดียว ไม่มี login) ไปแล้ว
-- ให้ใช้ supabase/migration_v1_to_v2.sql แทน (ไม่ใช่ไฟล์นี้)
--
-- วิธีใช้: Supabase Dashboard > SQL Editor > New query > วางทั้งหมด > Run
-- ========================================================

-- โปรไฟล์ส่วนตัว: 1 คน 1 แถว ผูกกับบัญชีผู้ใช้ (auth.users) โดยตรง
create table if not exists profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  full_name text,
  gender text check (gender in ('male','female')),
  age int,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  activity_level text check (activity_level in ('sedentary','light','moderate','active')),
  goal text,                       -- เช่น "ลดไขมัน", "เพิ่มกล้ามเนื้อ"
  daily_calorie_target int,
  daily_protein_target_g int,
  notes text,
  updated_at timestamptz not null default now()
);

-- มื้ออาหารตามวัน (ของแต่ละคน)
create table if not exists meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  calories int,
  notes text,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ตารางออกกำลังกายตามวัน (ของแต่ละคน)
create table if not exists workout_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  time_of_day text,         -- เช่น "เช้า", "เย็น", "18:00"
  exercise_name text not null,
  duration_minutes int,
  sets int,
  reps int,
  notes text,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_entries_user_date on meal_entries (user_id, entry_date);
create index if not exists idx_workout_entries_user_date on workout_entries (user_id, entry_date);

-- ---------------------------------------------------------
-- Row Level Security: ทุกคนเห็น/แก้ได้เฉพาะข้อมูลของตัวเองเท่านั้น
-- ---------------------------------------------------------
alter table profiles enable row level security;
alter table meal_entries enable row level security;
alter table workout_entries enable row level security;

drop policy if exists "own_profile" on profiles;
create policy "own_profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own_meal_entries" on meal_entries;
create policy "own_meal_entries" on meal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_workout_entries" on workout_entries;
create policy "own_workout_entries" on workout_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
