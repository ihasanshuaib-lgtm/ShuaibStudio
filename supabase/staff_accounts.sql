-- حسابات فريق العمل لصفحة الموظفين staff.html (اسم مستخدم + كلمة سر، بدون إيميل)
-- تُدار من main.html → الإعدادات → «🔐 الحسابات والصلاحيات».
-- كلمات السر تُحفظ مشفّرة (bcrypt) ولا يمكن قراءتها، فقط تغييرها.
-- شغّل هذا الملف مرة واحدة في Supabase → SQL Editor (بعد staff.sql).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.staff_accounts (
  username      text primary key check (username = lower(username) and username !~ '[[:space:]@]' and length(username) between 2 and 32),
  display_name  text not null default '' check (length(display_name) <= 60),
  pass_hash     text not null,
  active        boolean not null default true,
  fails         int not null default 0,
  locked_until  timestamptz,
  last_login    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create table if not exists public.staff_sessions (
  token       text primary key,
  username    text not null references public.staff_accounts(username) on update cascade on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '60 days'
);
-- لا أحد يصل للجدولين مباشرة؛ فقط عبر الدوال أدناه
alter table public.staff_accounts enable row level security;
alter table public.staff_sessions enable row level security;
revoke all on public.staff_accounts, public.staff_sessions from anon, authenticated;

create or replace function public.ss_is_owner() returns boolean
language sql stable as $$ select coalesce(auth.jwt() ->> 'email', '') = 'ihasanshuaib@gmail.com' $$;

-- ── للمالك: عرض الحسابات (بدون كلمات السر) ──
create or replace function public.staff_acc_list()
returns table(username text, display_name text, active boolean, last_login timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not ss_is_owner() then raise exception 'not allowed'; end if;
  return query select a.username, a.display_name, a.active, a.last_login, a.updated_at
    from staff_accounts a order by a.created_at;
end $$;

-- ── للمالك: إضافة (p_old = null) أو تعديل حساب. كلمة السر الفارغة = بدون تغيير ──
create or replace function public.staff_acc_save(p_old text, p_user text, p_name text, p_pass text, p_active boolean)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare u text := lower(trim(coalesce(p_user, ''))); o text := lower(trim(coalesce(p_old, '')));
begin
  if not ss_is_owner() then raise exception 'not allowed'; end if;
  if u ~ '[[:space:]@]' or length(u) not between 2 and 32 then raise exception 'bad username'; end if;
  if coalesce(p_pass, '') <> '' and length(p_pass) < 4 then raise exception 'short password'; end if;
  if o = '' then
    if coalesce(p_pass, '') = '' then raise exception 'password required'; end if;
    if exists(select 1 from staff_accounts where username = u) then raise exception 'username taken'; end if;
    insert into staff_accounts(username, display_name, pass_hash, active)
      values (u, coalesce(trim(p_name), ''), crypt(p_pass, gen_salt('bf')), coalesce(p_active, true));
  else
    if u <> o and exists(select 1 from staff_accounts where username = u) then raise exception 'username taken'; end if;
    update staff_accounts set
      username = u,
      display_name = coalesce(trim(p_name), display_name),
      active = coalesce(p_active, active),
      pass_hash = case when coalesce(p_pass, '') <> '' then crypt(p_pass, gen_salt('bf')) else pass_hash end,
      fails = 0, locked_until = null, updated_at = now()
    where username = o;
    if not found then raise exception 'no such user'; end if;
    -- تغيير كلمة السر أو الإيقاف يُخرج الموظف من كل الأجهزة
    if coalesce(p_pass, '') <> '' or p_active is false then delete from staff_sessions where username = u; end if;
  end if;
end $$;

create or replace function public.staff_acc_delete(p_user text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not ss_is_owner() then raise exception 'not allowed'; end if;
  delete from staff_accounts where username = lower(trim(p_user));
end $$;

-- ── للموظف: الدخول. يرجع {token, name} أو null. 8 محاولات خاطئة = قفل 15 دقيقة ──
create or replace function public.staff_login(p_user text, p_pass text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare a staff_accounts; t text;
begin
  select * into a from staff_accounts where username = lower(trim(coalesce(p_user, '')));
  if not found or not a.active then return null; end if;
  if a.locked_until is not null and a.locked_until > now() then return json_build_object('locked', true); end if;
  if a.pass_hash <> crypt(coalesce(p_pass, ''), a.pass_hash) then
    update staff_accounts set fails = fails + 1,
      locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end
    where username = a.username;
    return null;
  end if;
  t := encode(gen_random_bytes(24), 'hex');
  delete from staff_sessions where expires_at < now();
  insert into staff_sessions(token, username) values (t, a.username);
  update staff_accounts set fails = 0, locked_until = null, last_login = now() where username = a.username;
  return json_build_object('token', t, 'name', coalesce(nullif(a.display_name, ''), a.username), 'user', a.username);
end $$;

-- ── للموظف: جدول التصوير (بدون أسعار). null = الجلسة انتهت أو الحساب أُوقف ──
create or replace function public.staff_sched(p_tok text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare a staff_accounts;
begin
  select ac.* into a from staff_sessions s join staff_accounts ac on ac.username = s.username
    where s.token = p_tok and s.expires_at > now() and ac.active;
  if not found then return null; end if;
  return json_build_object(
    'name', coalesce(nullif(a.display_name, ''), a.username),
    'value', (select value from staff_schedule where key = 'sched'));
end $$;

create or replace function public.staff_logout(p_tok text)
returns void
language sql security definer set search_path = public as $$ delete from staff_sessions where token = p_tok $$;

revoke all on function public.staff_acc_list(), public.staff_acc_save(text,text,text,text,boolean),
  public.staff_acc_delete(text), public.staff_login(text,text), public.staff_sched(text), public.staff_logout(text) from public;
grant execute on function public.staff_acc_list(), public.staff_acc_save(text,text,text,text,boolean),
  public.staff_acc_delete(text) to authenticated;
grant execute on function public.staff_login(text,text), public.staff_sched(text), public.staff_logout(text) to anon, authenticated;

-- ── لشاشة الدخول: أسماء الحسابات المفعّلة فقط ليختار الموظف اسمه (بدون أي بيانات أخرى) ──
create or replace function public.staff_login_names()
returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('u', username, 'n', coalesce(nullif(display_name, ''), username))
           order by coalesce(nullif(display_name, ''), username)), '[]'::json)
  from staff_accounts where active
$$;
revoke all on function public.staff_login_names() from public;
grant execute on function public.staff_login_names() to anon, authenticated;
