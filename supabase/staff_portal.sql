-- ═══════════════════════════════════════════════════════════════
--  صفحة الموظف — شعيب استوديو   (Staff portal)
--  Supabase ← SQL Editor ← New query ← الصق الملف ← Run   (مرة واحدة؛ إعادة التشغيل آمنة)
--  كل موظف له رابط خاص (رمز عشوائي طويل) يفتح employee.html#t=<الرمز>
--  ويرى فيه: راتبه، تصويراته القادمة والسابقة، مبالغها، المهام — حسب ما يسمح به صاحب الاستوديو.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.staff_portal (
  token       text primary key,          -- رمز عشوائي طويل = الرابط
  staff_id    text,
  data        jsonb not null default '{}'::jsonb,
  last_seen   timestamptz,               -- آخر مرة فتح الموظف صفحته
  updated_at  timestamptz default now()
);

-- لا أحد يقرأ الجدول مباشرة إلا صاحب الاستوديو
alter table public.staff_portal enable row level security;
drop policy if exists owner_all on public.staff_portal;
create policy owner_all on public.staff_portal for all to authenticated
  using ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com');
grant select, insert, update, delete on public.staff_portal to authenticated;

-- الموظف يقرأ صفحته فقط، وبالرمز الصحيح فقط
create or replace function public.staff_portal_get(t text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.staff_portal;
begin
  if t is null or length(t) < 20 then return jsonb_build_object('error','invalid'); end if;
  select * into r from public.staff_portal where token = t;
  if not found then return jsonb_build_object('error','invalid'); end if;
  update public.staff_portal set last_seen = now() where token = t;
  return r.data;
end $$;
revoke all on function public.staff_portal_get(text) from public;
grant execute on function public.staff_portal_get(text) to anon, authenticated;
