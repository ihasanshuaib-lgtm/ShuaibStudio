-- جدول حجوزات الزبائن: أي زائر يستطيع الإضافة فقط، والقراءة/التعديل لصاحب الاستوديو (مستخدم مسجّل) فقط.
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  payload     jsonb not null check (pg_column_size(payload) < 8000),
  imported    boolean not null default false
);

alter table public.bookings enable row level security;

drop policy if exists "anyone can create a booking" on public.bookings;
create policy "anyone can create a booking"
  on public.bookings for insert to anon, authenticated with check (true);

drop policy if exists "owner reads bookings" on public.bookings;
create policy "owner reads bookings"
  on public.bookings for select to authenticated using (true);

drop policy if exists "owner updates bookings" on public.bookings;
create policy "owner updates bookings"
  on public.bookings for update to authenticated using (true) with check (true);

grant insert on public.bookings to anon;
grant select, insert, update on public.bookings to authenticated;
