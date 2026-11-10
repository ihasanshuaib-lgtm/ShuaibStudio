// ═══ كتالوج صفحة الحجز: أنواع التصوير + الباقات + الخدمات (القيم الافتراضية) ═══
// يُحمَّل في index.html (صفحة الحجز) وmain.html (الإعدادات ← الباقات والخدمات).
// الأسعار/الباقات/الخدمات التي يعدّلها المالك من الإعدادات تُحفظ في Supabase (جدول site_config، المفتاح 'catalog')
// وتطبّقها applyCatalog() فوق هذه القيم. لا تغيّر معرّفات (id) الباقات/الخدمات الموجودة: يجب أن تكون فريدة داخل النوع.
window.CATEGORIES_DEFAULT = {
  weddings: {
    name: 'تصوير الأعراس',
    icon: '💍',
    info: {
      nameLabel: 'الاسم الكامل',
      namePlaceholder: 'اسم العريس / العميل',
      dateLabel: 'تاريخ التصوير',
      datePlaceholder: 'مثال: 25 ديسمبر 2026',
      timeLabel: 'وقت التصوير',
      timePlaceholder: 'مثال: 7:00 مساءً',
      extraFields: [
        {id:'venue', required:true, loc:true, label:'المكان', placeholder:'مثال: قصر الأفراح'}
      ]
    },
    packages: [
      {id:'p1', name:'باقة الذكريات', icon:'📸', price:50, desc:'تصوير فوتوغرافي', tier:1},
      {id:'p2', name:'باقة الذكريات بلس', icon:'📸', price:85, desc:'تصوير فوتو + فيديو + مقابلات', tier:1},
      {id:'p3', name:'باقة الفخامة', icon:'⭐', price:99, desc:'فوتو + فيديو + مقابلات + بطاقة دعوة', badge:'الأكثر طلباً', tier:2},
      {id:'p4', name:'باقة الفخامة بلس', icon:'💌', price:130, desc:'فوتو + فيديو + مقابلات + برومو + بطاقة دعوة + تصوير شخصي', tier:2},
      {id:'p5', name:'باقة فيلم العمر', icon:'🎬', price:160, desc:'جميع المميزات + تصوير شخصي + فيديو سينمائي + برومو لتفاصيل كشخة المعرس + طباعة صور', tier:3},
    ],
    services: [
      {id:'s1', name:'تصوير بطاقة الدعوة في منزل المعرس', price:10},
      {id:'s2', name:'تصوير فيديو ثابت طوال مدة الحفل', price:12},
      {id:'s3', name:'تصوير جوال / ريلز', price:8},
      {id:'s4', name:'طباعة الصور', price:0.5, perUnit:true},
      {id:'s5', name:'خدمة توصيل USB أو الصور المطبوعة', price:2},
      {id:'s6', name:'خدمة الباركود الفوري للصور', note:'باركود QR يتيح للضيوف الوصول فورًا لجميع الصور', price:10},
      {id:'s7', name:'مونتاج لكواليس الحفل العفوية', price:5},
      {id:'s8', name:'تعديل الصور الاحترافي', price:10},
      {id:'s9', name:'تصوير أبو المعرس - كاميرا إضافية', price:20},
      {id:'s10', name:'تصوير 360 للحفل', price:10},
      {id:'s11', name:'تسريع التسليم (خلال 24 ساعة)', price:20},
      {id:'s12', name:'تصوير وتصميم بطاقة الدعوة', price:20},
    ]
  },

  realestate: {
    name: 'تصوير منتجات وأطعمة',
    icon: '🍽️',
    info: {
      nameLabel: 'اسم العميل / المتجر',
      namePlaceholder: 'اسم العميل أو المتجر',
      dateLabel: 'تاريخ التصوير',
      datePlaceholder: 'مثال: 10 يناير 2027',
      timeLabel: 'وقت التصوير',
      timePlaceholder: 'مثال: 10:00 صباحًا',
      extraFields: [
        {id:'productType', label:'نوع المنتج / الأطعمة', placeholder:'مثال: مطعم، عطور، ملابس، حلويات'},
        {id:'shootLocation', required:true, loc:true, label:'مكان التصوير', placeholder:'الاستوديو أو موقع العميل'}
      ]
    },packages: [
  {
    id: 'r0',
    name: 'الباقة الأولى',
    icon: '📷',
    price: 40,
    desc: 'تصوير فوتو احترافي + مدة التصوير ساعتين'
  },
  {
    id: 'r1',
    name: 'الباقة الثانية',
    icon: '📷',
    price: 60,
    desc: 'تصوير فوتو احترافي + مدة التصوير 3 ساعات'
  },
  {
    id: 'r2',
    name: 'الباقة الثالثة',
    icon: '⭐',
    price: 70,
    desc: 'تصوير فوتو احترافي + فيديو ريلز احترافي + مدة التصوير ساعتين',
    badge: 'الأكثر طلباً'
  },
  {
    id: 'r3',
    name: 'الباقة الرابعة',
    icon: '📷',
    price: 90,
    desc: 'تصوير فوتو احترافي + فيديو ريلز احترافي + مدة التصوير 3 ساعات'
  }
],
    services: [
      {id:'rs1', name:'تصوير فيديو ترويجي إضافي', price:25},
      {id:'rs4', name:'خلفيات إضافية متعددة', price:8},
      {id:'rs5', name:'تسريع التسليم (خلال 24 ساعة)', price:20},
    ]
  },

  event: {
    name: 'تصوير إيفنت',
    icon: '🎉',
    info: {
      nameLabel: 'اسم العميل / الجهة المنظمة',
      namePlaceholder: 'اسم العميل',
      dateLabel: 'تاريخ الإيفنت',
      datePlaceholder: 'مثال: 5 فبراير 2027',
      timeLabel: 'وقت الإيفنت',
      timePlaceholder: 'مثال: 6:00 مساءً',
      extraFields: [
        {id:'eventType', label:'نوع الإيفنت', placeholder:'مثال: مؤتمر، حفل افتتاح، معرض'},
        {id:'eventLocation', required:true, loc:true, label:'موقع الإيفنت', placeholder:'اسم المكان / المنطقة'}
      ]
    },
    packages: [
      {id:'e1', name:'الباقة الأولى', icon:'📸', price:50, desc:'تصوير فوتوغرافي لمدة ساعتين'},
      {id:'e2', name:'الباقة الثانية', icon:'📸', price:80, desc:'تصوير فوتوغرافي لمدة 3 ساعات'},
      {id:'e3', name:'الباقة الثالثة', icon:'⭐', price:150, desc:'تصوير فوتو + فيديو لمدة الحفل كاملة', badge:'الأكثر طلباً'},
      {id:'e4', name:'الباقة الرابعة', icon:'🎬', price:200, desc:'فوتو + فيديو +فيديو للحفل كامل + ريلز '},
    ],
    services: [
      {id:'es1', name:'تصوير جوال / ريلز لحظي', price:10},
      {id:'es2', name:'مصور إضافي', price:25},
      {id:'es3', name:'بث مباشر للحفل (Live Streaming)', price:40},
      {id:'es4', name:'طباعة الصور الفورية', price:0.5, perUnit:true},
      {id:'es5', name:'مونتاج فيديو تلخيصي', price:20},
      {id:'es6', name:'تصوير 360 للحفل', price:10},
      {id:'es7', name:'تسريع التسليم (خلال 24 ساعة)', price:20},
    ]
  },

  montage: {
    name: 'مونتاج / تعديل',
    icon: '🎞️',
    info: {
      nameLabel: 'اسم العميل',
      namePlaceholder: 'اسم العميل',
      dateLabel: 'تاريخ التسليم المطلوب',
      datePlaceholder: 'مثال: 1 مارس 2027',
      timeLabel: 'موعد التسليم',
      timePlaceholder: 'مثال: مساءً / صباحًا',
      extraFields: [
        {id:'footageLength', label:'مدة المادة الخام', placeholder:'مثال: 3 ساعات تصوير'},
        {id:'deliveryMethod', label:'طريقة استلام المادة الخام', placeholder:'مثال: رابط تحميل، هارد، USB'}
      ]
    },
    packages: [
      {id:'m1', name:'باقة المونتاج السريع', icon:'✂️', price:20, desc:'مونتاج فيديو قصير حتى 3 دقائق'},
      {id:'m2', name:'باقة المونتاج الاحترافي', icon:'🎞️', price:40, desc:'مونتاج فيديو كامل مع موسيقى وانتقالات'},
      {id:'m3', name:'باقة المونتاج السينمائي', icon:'⭐', price:70, desc:'مونتاج سينمائي مع تصحيح ألوان واحترافية متقدمة', badge:'الأكثر طلباً'},
    ],
    services: [
      {id:'ms1', name:'تصحيح الألوان (Color Grading)', price:15},
      {id:'ms2', name:'إضافة موسيقى وصوتيات', price:10},
      {id:'ms3', name:'نسخة قصيرة للسوشيال ميديا (ريلز)', price:15},
      {id:'ms4', name:'ترجمة / إضافة نصوص توضيحية', price:10},
      {id:'ms5', name:'تسريع التسليم (خلال 24 ساعة)', price:20},
    ]
  },

  graduation: {
    name: 'حفل تخرج',
    icon: '🎓',
    info: {
      nameLabel: 'اسم الخريج / العميل',
      namePlaceholder: 'اسم الخريج',
      dateLabel: 'تاريخ الحفل',
      datePlaceholder: 'مثال: 15 يونيو 2027',
      timeLabel: 'وقت الحفل',
      timePlaceholder: 'مثال: 4:00 عصرًا',
      extraFields: [
        {id:'university', required:true, loc:true, label:'الجامعة / المدرسة', placeholder:'اسم الجامعة'}
      ]
    },
    packages: [
      {id:'g1', name:'البكج الأول', icon:'✨', price:90, desc:'تصوير فيديو + تصوير فوتوغرافي لتكريم الأطفال + مونتاج فيديو قصير للإنستقرام'},
      {id:'g2', name:'البكج الثاني', icon:'🎥', price:150, desc:'تصوير فيديو + تصوير فوتوغرافي لتكريم الأطفال + مونتاج فيديو قصير للإنستقرام + تغطية جميع فقرات الحفل + مونتاج كامل للحفل + مقابلات قصيرة مع الحضور'},
      {id:'g3', name:'البكج الثالث', icon:'🎬', price:190, desc:'تصوير فيديو + تصوير فوتوغرافي لتكريم الأطفال + مونتاج فيديو قصير للإنستقرام + تغطية فيديو لجميع فقرات الحفل + مونتاج فيديو كامل للحفل (ساعتين) + مونتاج احترافي لفقرات الحفل كاملة (كل فقرة منفصلة) + مونتاج فيديو مميز للحفل (إنستقرام) + مقابلات قصيرة مع الحضور'},
    ],
    services: [
      {id:'gs1', name:'جلسة تصوير شخصية إضافية (خارج الحفل)', price:20},
      {id:'gs2', name:'طباعة الصور', price:0.5, perUnit:true},
      {id:'gs3', name:'مصور جوال ', price:10},
      {id:'gs4', name:'مونتاج فيديو تلخيصي للحفل', price:15},
      {id:'gs5', name:'تسريع التسليم (خلال 24 ساعة)', price:20},
    ]
  },

  // نوع «مخصص»: باقة مخصّصة بالسعر الحي (ساعات × مصورين) + خدمات التعديل والمونتاج والتصميم
  custom: {
    name: 'مخصص',
    icon: '🛠️',
    info: {
      nameLabel: 'الاسم الكامل',
      namePlaceholder: 'اسم العميل',
      dateLabel: 'تاريخ التصوير',
      datePlaceholder: 'مثال: 20 مارس 2027',
      timeLabel: 'وقت التصوير',
      timePlaceholder: 'مثال: 5:00 مساءً',
      extraFields: [
        {id:'occasion', label:'نوع المناسبة', placeholder:'مثال: حفل عائلي، إطلاق منتج، جلسة شخصية'},
        {id:'customLocation', required:true, loc:true, label:'مكان التصوير', placeholder:'اسم المكان / المنطقة'}
      ]
    },
    // السعر = الساعات × (مصوّرو الفوتو + مصوّرو الفيديو) × perHour (د.ب لكل ساعة لكل مصوّر)
    custom: {perHour:36, minHours:0, defaultHours:2, maxHours:12, maxEach:4},
    packages: [],
    services: [
      {id:'cs1', name:'تعديل الصور', price:10},
      {id:'cs2', name:'المونتاج كامل', price:20},
      {id:'cs3', name:'التصميم', price:8},
      {id:'cs4', name:'مونتاج ريلز', price:15},
    ]
  },
};

// يطبّق تعديلات المالك {cats:{<نوع>:{packages,services,perHour}}} على نسخة من الكتالوج (يتجاهل أي قيمة غير صالحة)
window.applyCatalog = function(base, ov){
  const C = JSON.parse(JSON.stringify(base));
  const cats = ov && ov.cats;
  if(!cats || typeof cats !== 'object') return C;
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  const num = v => { const x = +v; return isFinite(x) && x >= 0 ? Math.round(x * 1000) / 1000 : null; };
  Object.keys(C).forEach(k => {
    const o = cats[k]; if(!o || typeof o !== 'object') return;
    if(Array.isArray(o.packages)) C[k].packages = o.packages.filter(p => p && p.id && str(p.name,120).trim() && num(p.price) != null).map(p => {
      const q = {id:str(p.id,40), name:str(p.name,120), icon:str(p.icon||'📸',8), price:num(p.price), desc:str(p.desc,400)};
      if(str(p.badge,40).trim()) q.badge = str(p.badge,40);
      if(p.tier) q.tier = +p.tier || 1;
      return q;
    });
    if(Array.isArray(o.services)) C[k].services = o.services.filter(x => x && x.id && str(x.name,160).trim() && num(x.price) != null).map(x => {
      const q = {id:str(x.id,40), name:str(x.name,160), price:num(x.price)};
      if(str(x.note,300).trim()) q.note = str(x.note,300);
      if(x.perUnit) q.perUnit = true;
      return q;
    });
    if(C[k].custom && num(o.perHour) > 0) C[k].custom.perHour = num(o.perHour);
  });
  return C;
};
