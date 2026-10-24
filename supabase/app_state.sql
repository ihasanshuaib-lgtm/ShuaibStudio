-- حفظ بيانات pay.html (الفواتير، العملاء، الموظفون، التكاليف) سحابيًا لتظهر في أي متصفح/جهاز.
-- للمستخدم المسجّل فقط (حساب الاستوديو)؛ الزوار بلا أي وصول.
create table if not exists public.app_state (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "owner reads state" on public.app_state;
create policy "owner reads state" on public.app_state for select to authenticated using (true);

drop policy if exists "owner inserts state" on public.app_state;
create policy "owner inserts state" on public.app_state for insert to authenticated with check (true);

drop policy if exists "owner updates state" on public.app_state;
create policy "owner updates state" on public.app_state for update to authenticated using (true) with check (true);

grant select, insert, update on public.app_state to authenticated;
