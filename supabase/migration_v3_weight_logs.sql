-- v3: บันทึกน้ำหนักรายวัน (ใช้ทำกราฟความก้าวหน้า)
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  weight_kg numeric(5,1) not null check (weight_kg > 20 and weight_kg < 400),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists idx_weight_logs_user_date on weight_logs (user_id, log_date);

alter table weight_logs enable row level security;

drop policy if exists "own_weight_logs" on weight_logs;
create policy "own_weight_logs" on weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
