-- كودات الخصم: تُدار من «الإعدادات» في main.html، وتتحقق منها صفحة الحجز index.html
-- شغّل هذا الملف مرة واحدة في Supabase → SQL Editor
create table if not exists public.discount_codes (
  code        text primary key check (code = lower(code) and length(code) between 1 and 40),
  pct         numeric not null check (pct > 0 and pct <= 100),
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
alter table public.discount_codes enable row level security;

-- القراءة والتعديل لصاحب الاستوديو فقط (الزوار لا يرون قائمة الكودات)
drop policy if exists "owner manages discounts" on public.discount_codes;
create policy "owner manages discounts" on public.discount_codes for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');
grant select, insert, update, delete on public.discount_codes to authenticated;

-- التحقق من كود واحد للزوار: يُرجع نسبة الخصم (مثل 10) أو null — دون كشف بقية الكودات
create or replace function public.check_discount(p_code text)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select pct from public.discount_codes
  where code = lower(trim(p_code)) and active
  limit 1;
$$;
revoke all on function public.check_discount(text) from public;
grant execute on function public.check_discount(text) to anon, authenticated;
