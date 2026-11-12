-- ═══════════════════════════════════════════════════════════════
--  صفحة التعليم — شعيب استوديو   (learn.html)
--  Supabase ← SQL Editor ← New query ← الصق الملف ← Run   (مرة واحدة؛ إعادة التشغيل آمنة ولا تكرر الدروس)
--  يتطلب: supabase/staff_portal.sql (روابط الموظفين)
--  الدخول: الموظف عبر رابط بوابته (learn.html#t=<رمزه>)، وصاحب الاستوديو بحسابه (من لوحة التحكم).
-- ═══════════════════════════════════════════════════════════════

-- 1) الدروس
create table if not exists public.lessons (
  id          bigint generated always as identity primary key,
  section     text not null,                       -- photo | video | edit | montage | tips
  tag         text not null default '',            -- تصنيف فرعي اختياري: الأعراس، بورتريه، داخلي...
  title       text not null,
  body        text not null default '',            -- نص بتنسيق بسيط (## عنوان، - نقطة، **عريض**)
  images      jsonb not null default '[]'::jsonb,  -- روابط الصور (Storage: learn)
  author_key  text not null,                       -- owner | s<staff_id>
  author_name text not null default '',
  pinned      boolean not null default false,
  seed        text unique,                         -- مفتاح الدروس الأساسية (يمنع التكرار)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.lessons enable row level security;
drop policy if exists owner_all on public.lessons;
create policy owner_all on public.lessons for all to authenticated
  using ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com')
  with check ((auth.jwt()->>'email') = 'ihasanshuaib@gmail.com');

-- 2) من المستخدم؟ صاحب الاستوديو (بحسابه) أو موظف (برمز بوابته، إن لم يُخفِ المالك التعليم عنه)
create or replace function public.learn_actor(t text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r public.staff_portal;
begin
  if coalesce(auth.jwt()->>'email','') = 'ihasanshuaib@gmail.com' then
    return jsonb_build_object('key','owner','name','شعيب استوديو','owner',true);
  end if;
  if t is null or length(t) < 20 then return null; end if;
  select * into r from public.staff_portal where token = t;
  if not found or coalesce(r.data->'show'->>'learn','true') = 'false' then return null; end if;
  return jsonb_build_object('key','s'||r.staff_id,'name',coalesce(nullif(r.data->>'name',''),'موظف'),'owner',false);
end $$;

-- 3) قراءة كل الدروس
create or replace function public.learn_list(t text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb;
begin
  me := public.learn_actor(t);
  if me is null then return jsonb_build_object('error','invalid'); end if;
  return jsonb_build_object('me', me, 'lessons', coalesce((
    select jsonb_agg(jsonb_build_object('id',id,'section',section,'tag',tag,'title',title,'body',body,'images',images,
             'author_key',author_key,'author_name',author_name,'pinned',pinned,'created_at',created_at,'updated_at',updated_at)
           order by pinned desc, updated_at desc)
    from public.lessons), '[]'::jsonb));
end $$;

-- 4) إضافة/تعديل درس (الموظف يعدّل دروسه فقط؛ المالك يعدّل الكل ويثبّت)
create or replace function public.learn_save(t text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb; v_id bigint; v_imgs jsonb; v_sec text; v_title text;
begin
  me := public.learn_actor(t);
  if me is null then return jsonb_build_object('error','invalid'); end if;
  v_sec := coalesce(p->>'section','');
  if v_sec not in ('photo','video','edit','montage','tips') then return jsonb_build_object('error','section'); end if;
  v_title := btrim(coalesce(p->>'title',''));
  if length(v_title) < 2 or length(v_title) > 140 then return jsonb_build_object('error','title'); end if;
  if length(coalesce(p->>'body','')) > 20000 then return jsonb_build_object('error','body'); end if;
  v_imgs := coalesce(p->'images','[]'::jsonb);
  if jsonb_typeof(v_imgs) <> 'array' or jsonb_array_length(v_imgs) > 8 then return jsonb_build_object('error','images'); end if;
  if exists (select 1 from jsonb_array_elements_text(v_imgs) u where u not like 'https://%/storage/v1/object/public/learn/%') then
    return jsonb_build_object('error','images');
  end if;
  if p ? 'id' and nullif(p->>'id','') is not null then
    v_id := (p->>'id')::bigint;
    update public.lessons set section = v_sec, tag = left(btrim(coalesce(p->>'tag','')),40), title = v_title,
           body = coalesce(p->>'body',''), images = v_imgs, updated_at = now(),
           pinned = case when (me->>'owner')::boolean then coalesce((p->>'pinned')::boolean, pinned) else pinned end
     where id = v_id and ((me->>'owner')::boolean or author_key = me->>'key');
    if not found then return jsonb_build_object('error','forbidden'); end if;
  else
    insert into public.lessons(section, tag, title, body, images, author_key, author_name, pinned)
    values (v_sec, left(btrim(coalesce(p->>'tag','')),40), v_title, coalesce(p->>'body',''), v_imgs, me->>'key', me->>'name',
            case when (me->>'owner')::boolean then coalesce((p->>'pinned')::boolean,false) else false end)
    returning id into v_id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- 5) حذف درس
create or replace function public.learn_delete(t text, lid bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb;
begin
  me := public.learn_actor(t);
  if me is null then return jsonb_build_object('error','invalid'); end if;
  delete from public.lessons where id = lid and ((me->>'owner')::boolean or author_key = me->>'key');
  if not found then return jsonb_build_object('error','forbidden'); end if;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.learn_actor(text) from public;
revoke all on function public.learn_list(text) from public;
revoke all on function public.learn_save(text, jsonb) from public;
revoke all on function public.learn_delete(text, bigint) from public;
grant execute on function public.learn_list(text) to anon, authenticated;
grant execute on function public.learn_save(text, jsonb) to anon, authenticated;
grant execute on function public.learn_delete(text, bigint) to anon, authenticated;

-- 6) صور الدروس: مخزن عام للقراءة (learn)؛ الرفع فقط لصاحب الاستوديو أو لموظف داخل مجلد = sha256(رمزه)
--    (المجلد مُشفَّر حتى لا يظهر رمز الموظف في روابط الصور التي يراها زملاؤه)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learn', 'learn', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists learn_upload on storage.objects;
create policy learn_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'learn' and (
    coalesce(auth.jwt()->>'email','') = 'ihasanshuaib@gmail.com'
    or exists (select 1 from public.staff_portal s
               where encode(extensions.digest(s.token, 'sha256'), 'hex') = (storage.foldername(name))[1]
                 and coalesce(s.data->'show'->>'learn','true') <> 'false')));
drop policy if exists learn_remove on storage.objects;
create policy learn_remove on storage.objects for delete to anon, authenticated
  using (bucket_id = 'learn' and (
    coalesce(auth.jwt()->>'email','') = 'ihasanshuaib@gmail.com'
    or exists (select 1 from public.staff_portal s
               where encode(extensions.digest(s.token, 'sha256'), 'hex') = (storage.foldername(name))[1])));

-- 7) الدروس الأساسية (يمكن لصاحب الاستوديو تعديلها أو حذفها؛ لا تتكرر عند إعادة التشغيل)
insert into public.lessons (seed, section, tag, title, body, author_key, author_name, pinned) values
('photo-wedding','photo','الأعراس','إعدادات الكاميرا في تصوير الأعراس',
$b$## قبل الحفل
- صوّر بصيغة **RAW** (ومعها JPEG على الكرت الثاني كنسخة احتياطية).
- فعّل **الكرتين معًا (Backup)** — لا نخاطر بضياع صور عرس.
- اضبط **ساعة الكاميرا** مطابقة لكاميرات زملائك لترتيب الصور لاحقًا.
- التركيز: **AF-C** مع **تتبّع العين (Eye AF)**.

## داخل القاعة (إضاءة صفراء)
- Aperture: **f/2.8 – f/4** للأشخاص، **f/5.6 – f/8** للمجموعات.
- Shutter: لا تنزل عن **1/160** للحركة، و**1/250** للزفّة والرقص.
- ISO: تلقائي بحد أعلى **6400**.
- White Balance: يدوي **3200K – 4000K** حسب إضاءة القاعة (لا تستخدم Auto WB حتى تتطابق الألوان).
- الفلاش: ارتداد على السقف أو الجدار، TTL مع **-0.7 إلى -1 EV**.

## لقطات أساسية لا تفوتك
- التفاصيل: الخاتم، الفستان، العطر، الحذاء — عدسة 100mm (ماكرو) على **f/2.8**.
- دخول العروس، لحظة اللقاء، الأهل، القاعة كاملة قبل امتلائها.
- الصور الجماعية: **f/8، 1/200**، صف الناس بحيث تظهر كل الوجوه.

## نصائح
- صوّر **3 لقطات متتالية** للحظات المهمة (أحدها ستكون العيون مفتوحة).
- تحرّك بهدوء ولا تقف أمام ضيوف الصف الأول أو كاميرا الفيديو.$b$,'owner','شعيب استوديو',true),

('photo-portrait','photo','بورتريه','إعدادات التصوير الشخصي (بورتريه)',
$b$## الإعدادات
- العدسة: **85mm** (أو 50mm)، Aperture **f/1.8 – f/2.8** لخلفية ناعمة.
- Shutter: **1/250** أو أسرع.
- ISO: **100 – 400** في الخارج، وحتى **1600** داخل الاستوديو بلا مشكلة.
- التركيز على **العين الأقرب** للكاميرا (Eye AF).

## الإضاءة
- أفضل وقت في الخارج: **الساعة الذهبية** (قبل الغروب بساعة).
- لا تصوّر تحت شمس الظهر مباشرة — استخدم الظل أو عاكسًا.
- الضوء الرئيسي بزاوية **45°** من الوجه، والعاكس من الجهة الأخرى لتخفيف الظلال.

## التوجيه (Posing)
- اطلب من الشخص أن **يميل بالكتف** قليلًا وألا يقف مواجهًا للكاميرا تمامًا.
- الذقن للأمام وللأسفل قليلًا.
- تكلّم معه طوال الوقت — الصورة الطبيعية تأتي من الراحة.

## التكوين
- قاعدة **الأثلاث**، ومساحة في اتجاه نظر الشخص.
- لا تقص عند المفاصل (الركبة، المرفق، الرسغ).$b$,'owner','شعيب استوديو',false),

('video-settings','video','الإعدادات','إعدادات الكاميرا في تصوير الفيديو',
$b$## الأساسيات
- الدقة: **4K** (أو 1080p عند الحاجة لمساحة أقل).
- Frame rate: **25p** للمشاهد العادية (البحرين 50Hz)، **50p / 100p** للحركة البطيئة.
- **قاعدة 180°**: الشتر = ضعف الفريم ← 25p ← **1/50**، و 50p ← **1/100**.
- White Balance: **رقم Kelvin ثابت** وليس Auto (حتى لا يتغير اللون أثناء اللقطة).

## الألوان
- **S-Log3 / C-Log**: لمساحة أكبر في التعديل (ISO الأساسي غالبًا 800).
- **Standard / Cine-like**: للتسليم السريع بدون تلوين كثير.
- عرّض جيدًا: في اللوق ارفع التعريض **+1 إلى +1.7** لتقليل التشويش.

## الحركة والثبات
- استخدم الجيمبال للمشي، والترايبود للكلمات والمقابلات.
- التركيز: **AF-C** مع تتبّع الوجه، وسرعة تتبّع متوسطة حتى لا يقفز التركيز.

## الصوت
- لا تعتمد على مايك الكاميرا: مايك لاسلكي (Lav) للمتحدث أو مسجّل منفصل.
- مستوى الصوت حول **-12dB**، ولا يصل للأحمر.$b$,'owner','شعيب استوديو',true),

('video-in-out','video','داخلي / خارجي','التصوير الداخلي والخارجي',
$b$## داخل القاعات
- إضاءة القاعات تومض بتردد 50Hz ← التزم بشتر **1/50** أو **1/100** لتجنّب الخطوط والوميض.
- ارفع ISO قبل أن تفتح الفتحة أكثر من اللازم (تحتاج عمق ميدان كافٍ للحركة).
- خذ لقطة **White Balance** على ورقة بيضاء تحت إضاءة القاعة.

## في الخارج
- استخدم **فلتر ND** (متغيّر 2–5 stops) حتى تحافظ على شتر 1/50 مع فتحة واسعة.
- عرّض على **الإضاءات القوية** (السماء) حتى لا تحترق.
- أفضل وقت: الصباح الباكر أو قبل الغروب.

## الانتقال بين الداخل والخارج
- جهّز **Custom Mode** للداخل وآخر للخارج (C1 / C2) حتى تبدّل بضغطة.$b$,'owner','شعيب استوديو',false),

('video-before','video','قبل التصوير','معلومات مهمة قبل التصوير',
$b$## قبل يوم
- **اشحن كل البطاريات** (3 على الأقل لكل كاميرا) والمايكات والجيمبال.
- **فرّغ وفرمت الكروت** بعد التأكد أن ما عليها محفوظ نسخة.
- نظّف العدسات والحساس.
- تأكد من **المكان والوقت وجدول الحفل** مع العميل (وقت الزفّة، الكلمات، الكيكة).

## يوم التصوير
- احضر قبل الموعد بـ **30 دقيقة**.
- اضبط الإعدادات وجرّب الصوت قبل البدء.
- **طابق الوقت** بين كل الكاميرات (يسهّل المونتاج متعدد الكاميرات).
- صوّر لقطات المكان والتفاصيل قبل وصول الناس.

## بعد التصوير
- انسخ الملفات في **مكانين** نفس اليوم (هارد + سحابة) قبل مسح أي كرت.$b$,'owner','شعيب استوديو',false),

('edit-photos','edit','Lightroom','الإعدادات الصحيحة لتعديل الصور',
$b$## الترتيب الصحيح
1. **الاستيراد** مع نسخة احتياطية تلقائية.
2. **الفرز (Culling)**: اختر (P) واستبعد (X) — احذف المكرر والمغمض.
3. طبّق **بريست الاستوديو** كبداية.
4. **White Balance** أولًا، ثم Exposure.
5. Highlights **-** و Shadows **+** بحذر، ثم Whites/Blacks.
6. **لون البشرة**: من HSL ← البرتقالي (Hue/Saturation/Luminance) حتى تكون طبيعية.
7. Lens Corrections + تعديل الميلان والقص.
8. **Sync** الإعدادات على الصور المتشابهة لتوحيد الألوان.

## التصدير
- للتسليم: **JPEG، sRGB، جودة 90**، الحجم الكامل.
- لإنستقرام: الضلع الطويل **1350px** (عمودي 1080×1350).
- التسمية: `اسم-العميل_التاريخ_رقم`.

## تجنّب
- تنعيم البشرة الزائد (البشرة يجب أن يظهر ملمسها).
- التشبّع العالي والألوان غير الطبيعية.
- اختلاف الألوان بين صور نفس الحفل.$b$,'owner','شعيب استوديو',true),

('montage-flow','montage','طريقة العمل','طريقة عمل المونتاج خطوة بخطوة',
$b$## التنظيم
- مجلدات ثابتة: `Footage / Audio / Music / Graphics / Export`.
- اعمل **Proxies** للملفات الثقيلة (4K / Log) حتى يكون التحرير سلسًا.
- زامن الكاميرات **بالصوت** (Multicam).

## البناء
1. اختر **الموسيقى أولًا** — هي التي تحدد الإيقاع.
2. الهيكل: **بداية قوية (أجمل لقطة)** ← القصة ← اللحظات المهمة ← نهاية مؤثرة.
3. **القص على الإيقاع**، واستخدم J-Cut و L-Cut مع الكلام.
4. التلوين: حوّل اللوق بـ LUT أولًا (Color Correction) ثم أضف الطابع (Grading).

## الصوت
- الكلام حول **-12dB**، والموسيقى تحت الكلام حول **-20dB**.
- أزل الضجيج الخفيف، ولا تقطع الصوت فجأة (Fade قصير).

## التصدير
- **H.264، 25p**، 4K بـ 40–60 Mbps أو 1080p بـ 16–20 Mbps.
- ريلز: **1080×1920** ومدته 30–60 ثانية.$b$,'owner','شعيب استوديو',true),

('montage-tips','montage','نصائح','نصائح لمونتاج احترافي',
$b$- **أول 3 ثوانٍ** هي الأهم — ابدأ بأقوى لقطة.
- قلّل الانتقالات (Transitions) — القص النظيف أجمل.
- لا تكرر نفس اللقطة مرتين.
- خلي اللقطات قصيرة في الأجزاء السريعة، وأطول في اللحظات العاطفية.
- راجع الفيديو كاملًا **بعد استراحة** قبل التسليم.
- احفظ المشروع ونسخة احتياطية منه بعد كل جلسة عمل.$b$,'owner','شعيب استوديو',false),

('tips-general','tips','عام','قواعد العمل في الاستوديو',
$b$- **الالتزام بالوقت**: الوصول قبل الموعد بـ 30 دقيقة.
- اللبس مرتب وهادئ (يفضّل الأسود).
- **النسخ الاحتياطي** نفس يوم التصوير — قاعدة لا استثناء فيها.
- لا تنشر أي صورة من حفل بدون إذن الاستوديو.
- أي مشكلة في المعدات أو الموعد: بلّغ فورًا.
- تعامل مع الضيوف بهدوء واحترام — أنت تمثّل الاستوديو.$b$,'owner','شعيب استوديو',true)
on conflict (seed) do nothing;
