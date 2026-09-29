// ============================================================
// sw.js — Service Worker لتخزين الصور والصفحة في كاش المتصفح
//
// الفائدة: الزيارة الأولى تُحمّل الصور من الشبكة، وكل زيارة بعدها
// تُعرض الصور فورًا من الكاش (بدون انتظار الشبكة).
//
// القواعد:
//   • الصور (thumbs/ وصور الأنواع) : من الكاش فورًا + تحديث في الخلفية
//   • الصفحة index.html            : من الشبكة أولًا (لتظهر آخر التعديلات)
//                                    ومع عدم الاتصال تُعرض النسخة المحفوظة
//   • أي شيء من نطاق آخر (خطوط Google) لا يُلمس
//
// عند تعديل الصور: شغّل scripts/make-thumbs.sh وارفع THUMB_VERSION في
// index.html؛ ولإفراغ كل الكاش ارفع رقم CACHE_VERSION هنا.
// ============================================================

const CACHE_VERSION = 'v1';
const IMAGE_CACHE = 'shuaib-studio-images-' + CACHE_VERSION;
const PAGE_CACHE  = 'shuaib-studio-page-' + CACHE_VERSION;
const IMAGE_RE = /\.(?:jpe?g|png|gif|webp|avif|svg|ico)(?:\?|$)/i;

self.addEventListener('install', ()=>{
  self.skipWaiting();
});

self.addEventListener('activate', event=>{
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== IMAGE_CACHE && k !== PAGE_CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event=>{
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // خطوط Google وغيرها تُترك للمتصفح

  const isImage = req.destination === 'image' || IMAGE_RE.test(url.pathname);

  if(isImage){
    event.respondWith(staleWhileRevalidate(req, IMAGE_CACHE));
    return;
  }

  const isPage = req.mode === 'navigate' ||
                 url.pathname.endsWith('/') ||
                 url.pathname.endsWith('/index.html');
  if(isPage){
    event.respondWith(networkFirst(req, PAGE_CACHE));
  }
});

// الصور: أعطِ المخزّن فورًا (إن وُجد) وحدّثه في الخلفية
async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, {ignoreSearch:false});
  const fromNetwork = fetch(req).then(res=>{
    if(res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(()=> cached || Response.error());
  return cached || fromNetwork;
}

// الصفحة: الشبكة أولًا، وعند الفشل (عدم اتصال) نعرض النسخة المحفوظة
async function networkFirst(req, cacheName){
  const cache = await caches.open(cacheName);
  try{
    const res = await fetch(req);
    if(res && res.ok) cache.put(req, res.clone());
    return res;
  }catch(err){
    const cached = await cache.match(req);
    if(cached) return cached;
    throw err;
  }
}
