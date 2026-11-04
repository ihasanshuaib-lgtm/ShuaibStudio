-- ═══════════════════════════════════════════════════════════════
--  بوابة العميل — شعيب استوديو   (Client portal setup)
--  الخطوات: Supabase ← SQL Editor ← New query ← الصق هذا الملف كاملًا ← Run
--  يكفي تشغيله مرة واحدة. تشغيله مرة ثانية آمن ولا يحذف البيانات.
--  (إذا شغّلت نسخة سابقة: شغّل هذه النسخة مرة أخرى لإضافة صورة العميل والمعاينة)
-- ═══════════════════════════════════════════════════════════════

-- 1) صف لكل عميل: البيانات المسموح بها فقط (بدون أجور أو تكاليف أو أرباح)
create table if not exists public.client_portal (
  token        text primary key,          -- رمز عشوائي طويل = الرابط
  client_id    text,
  pin          text,                      -- آخر 4 أرقام من الهاتف (اختياري)
  data         jsonb not null default '{}'::jsonb,
  fails        int not null default 0,    -- محاولات رمز خاطئة
  locked_until timestamptz,               -- قفل مؤقت بعد 5 محاولات خاطئة
  last_seen    timestamptz,               -- آخر مرة فتح العميل الرابط
  updated_at   timestamptz default now()
);
alter table public.client_portal add column if not exists photo text;   -- صورة العميل (تظهر أعلى صفحته)

-- 2) ردود العملاء (الموافقة على عرض السعر أو رفضه) — تصل للوحة التحكم
create table if not exists public.portal_actions (
  id         bigint generated always as identity primary key,
  token      text not null,
  kind       text not null,
  ref        text,
  note       text,
  imported   boolean not null default false,
  created_at timestamptz default now()
);

-- 3) الحماية: لا أحد يقرأ الجدولين مباشرة إلا صاحب الاستوديو
alter table public.client_portal  enable row level security;
alter table public.portal_actions enable row level security;

drop policy if exists owner_all on public.client_portal;
create policy owner_all on public.client_portal for all to authenticated
  using ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com');

drop policy if exists owner_all on public.portal_actions;
create policy owner_all on public.portal_actions for all to authenticated
  using ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com');

-- 4) العميل يقرأ بياناته فقط عبر هذه الدالة، وبالرمز الصحيح فقط
create or replace function public.portal_get(t text, p text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.client_portal;
begin
  if t is null or length(t) < 20 then return jsonb_build_object('error','invalid'); end if;
  select * into r from public.client_portal where token = t;
  if not found then return jsonb_build_object('error','invalid'); end if;
  if r.locked_until is not null and r.locked_until > now() then
    return jsonb_build_object('error','locked','name', r.data->>'first');
  end if;
  if coalesce(r.pin,'') <> '' and coalesce(p,'') <> r.pin then
    update public.client_portal
       set fails = fails + 1,
           locked_until = case when fails + 1 >= 5 then now() + interval '15 minutes' else null end
     where token = t;
    return jsonb_build_object('error','pin','name', r.data->>'first');
  end if;
  update public.client_portal set fails = 0, locked_until = null, last_seen = now() where token = t;
  return r.data || jsonb_build_object('photo', coalesce(r.photo, ''));
end $$;

-- 5) ردود العميل: الموافقة على عرض السعر أو رفضه + فتح المعاينة ومشاركة الستوري
create or replace function public.portal_act(t text, p text, k text, r text, n text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; q jsonb;
begin
  if k not in ('approve_quote','reject_quote','preview_seen','story_shared') then return jsonb_build_object('error','kind'); end if;
  v := public.portal_get(t, p);
  if v ? 'error' then return v; end if;
  if k in ('preview_seen','story_shared') then
    if not exists (select 1 from jsonb_array_elements(coalesce(v->'sessions','[]'::jsonb)) x where x->>'id' = r) then
      return jsonb_build_object('error','state');
    end if;
    if not exists (select 1 from public.portal_actions where token = t and kind = k and ref = r) then
      insert into public.portal_actions(token, kind, ref) values (t, k, r);
    end if;
    return jsonb_build_object('ok', true);
  end if;
  select x into q from jsonb_array_elements(coalesce(v->'quotes','[]'::jsonb)) x where x->>'id' = r;
  if q is null or q->>'status' <> 'sent' then return jsonb_build_object('error','state'); end if;
  insert into public.portal_actions(token, kind, ref, note) values (t, k, r, left(n, 500));
  update public.client_portal
     set data = jsonb_set(data, '{quotes}', (
       select jsonb_agg(case when x->>'id' = r
                             then x || jsonb_build_object('status', case when k = 'approve_quote' then 'approved' else 'rejected' end)
                             else x end)
         from jsonb_array_elements(data->'quotes') x))
   where token = t;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.portal_get(text, text) from public;
revoke all on function public.portal_act(text, text, text, text, text) from public;
grant execute on function public.portal_get(text, text) to anon, authenticated;
grant execute on function public.portal_act(text, text, text, text, text) to anon, authenticated;

-- 6) ⚡ المعاينة خلال 24 ساعة: مكان صور المعاينة (صور مصغّرة فقط، حد 3MB للصورة)
--    كل جلسة لها مجلد باسم عشوائي طويل لا يمكن تخمينه، وصاحب الاستوديو وحده يرفع ويحذف
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('previews', 'previews', true, 3145728, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists previews_owner on storage.objects;
create policy previews_owner on storage.objects for all to authenticated
  using (bucket_id = 'previews' and (auth.jwt()->>'email') = 'ihasanshuaib@gmail.com')
  with check (bucket_id = 'previews' and (auth.jwt()->>'email') = 'ihasanshuaib@gmail.com');
