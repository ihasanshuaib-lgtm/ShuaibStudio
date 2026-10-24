-- جدول جدول التصوير للموظفين (بدون أسعار) + تقييد app_state على صاحب الاستوديو فقط.
-- 1) app_state (فيه الأسعار) للمالك فقط، حتى لا يقرأه حساب الموظفين
drop policy if exists "owner reads state" on public.app_state;
create policy "owner reads state" on public.app_state for select to authenticated
  using ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');
drop policy if exists "owner inserts state" on public.app_state;
create policy "owner inserts state" on public.app_state for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');
drop policy if exists "owner updates state" on public.app_state;
create policy "owner updates state" on public.app_state for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');

-- 2) جدول التصوير (تاريخ/وقت/اسم/باقة/مصورون/معدات فقط)
create table if not exists public.staff_schedule (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.staff_schedule enable row level security;

drop policy if exists "signed-in users read schedule" on public.staff_schedule;
create policy "signed-in users read schedule" on public.staff_schedule for select to authenticated using (true);

drop policy if exists "owner inserts schedule" on public.staff_schedule;
create policy "owner inserts schedule" on public.staff_schedule for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');
drop policy if exists "owner updates schedule" on public.staff_schedule;
create policy "owner updates schedule" on public.staff_schedule for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');

grant select, insert, update on public.staff_schedule to authenticated;

-- 3) حجوزات الزبائن (اسم/تاريخ/سعر): القراءة والتعديل للمالك فقط (الإضافة تبقى مفتوحة للزوار)
drop policy if exists "owner reads bookings" on public.bookings;
create policy "owner reads bookings" on public.bookings for select to authenticated
  using ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');
drop policy if exists "owner updates bookings" on public.bookings;
create policy "owner updates bookings" on public.bookings for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');
