-- ========================================================
-- Fitness & Meal Planner — Supabase schema
-- วิธีใช้: ไปที่ Supabase Dashboard > SQL Editor > New query
-- วางไฟล์นี้ทั้งหมดแล้วกด Run
-- ========================================================

-- โปรไฟล์ส่วนตัว (เก็บแถวเดียว เพราะใช้คนเดียว)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  age int,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  goal text,                -- เช่น "ลดไขมัน", "เพิ่มกล้ามเนื้อ"
  daily_calorie_target int,
  notes text,
  updated_at timestamptz not null default now()
);

-- มื้ออาหารตามวัน
create table if not exists meal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  calories int,
  notes text,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ตารางออกกำลังกายตามวัน
create table if not exists workout_entries (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists idx_meal_entries_date on meal_entries (entry_date);
create index if not exists idx_workout_entries_date on workout_entries (entry_date);

-- ---------------------------------------------------------
-- Row Level Security
-- โปรเจกต์นี้ไม่มีระบบ login (ใช้คนเดียว) จึงเปิดให้ anon key
-- อ่าน/เขียนได้ทั้งหมด เพื่อความง่าย
-- ⚠️ ข้อควรระวัง: ใครก็ตามที่มีลิงก์เว็บไซต์ของคุณจะเห็น/แก้ข้อมูลได้
-- ถ้าต้องการความเป็นส่วนตัวมากขึ้น ดูหัวข้อ "ความปลอดภัย" ใน README
-- ---------------------------------------------------------
alter table profiles enable row level security;
alter table meal_entries enable row level security;
alter table workout_entries enable row level security;

drop policy if exists "public_all_profiles" on profiles;
create policy "public_all_profiles" on profiles
  for all using (true) with check (true);

drop policy if exists "public_all_meal_entries" on meal_entries;
create policy "public_all_meal_entries" on meal_entries
  for all using (true) with check (true);

drop policy if exists "public_all_workout_entries" on workout_entries;
create policy "public_all_workout_entries" on workout_entries
  for all using (true) with check (true);

-- สร้างแถวโปรไฟล์เริ่มต้นไว้ 1 แถว (จะได้มีให้แก้ไขทันที)
insert into profiles (full_name)
select 'ของฉัน'
where not exists (select 1 from profiles);
