-- إعدادات الموقع العامة (مثل أسعار الباقات والخدمات لصفحة الحجز): يقرؤها الجميع، ويعدّلها صاحب الاستوديو فقط.
-- شغّل هذا الملف مرة واحدة في Supabase → SQL Editor
create table if not exists public.site_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.site_config enable row level security;

drop policy if exists "anyone reads site config" on public.site_config;
create policy "anyone reads site config" on public.site_config for select to anon, authenticated using (true);

drop policy if exists "owner writes site config" on public.site_config;
create policy "owner writes site config" on public.site_config for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ihasanshuaib@gmail.com');

grant select on public.site_config to anon, authenticated;
grant insert, update, delete on public.site_config to authenticated;
