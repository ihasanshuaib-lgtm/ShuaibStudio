// ═══ محرّك الحركة (motion.js) — يُدار من main.html ← الإعدادات ← «الحركة والانتقالات» ← المزايا المتقدمة ═══
// الإعدادات: SiteTheme.current().mx = {reveal, stagger, imgMask, skeleton, scaleIn, splitText, highlight, progress, toTop,
//   smartHeader, viewTrans, tap, ripple, haptic, fab, ctaBar, lightbox, kenBurns, video, focusGlow, toastAnim, success,
//   bottomSheet, countUp}  (preloader يُدار في theme.js لأنه يجب أن يظهر قبل رسم الصفحة)
// القواعد: transform/opacity فقط قدر الإمكان، IntersectionObserver لكل ما يعتمد على التمرير (مرة واحدة)، لا شيء مع
// prefers-reduced-motion، تأثيرات المرور داخل (hover:hover) فقط، و will-change أثناء الحركة فقط. الصفحة RTL: الاتجاهات معكوسة.
(function(){
  'use strict';
  var D = document, W = window, E = 'cubic-bezier(.22,1,.36,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)';
  var RM = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = function(){ return !!(RM && RM.matches); };
  var DASH = /(^|\/)(main|staff|salary_report|learn|employee)\.html$/i.test(location.pathname) || !!D.getElementById('settings-root');
  var S = {};
  var on = function(k){ return !!S[k] && !reduced(); };
  var $$ = function(sel, root){ try{ return Array.prototype.slice.call((root || D).querySelectorAll(sel)); }catch(e){ return []; } };
  var BTN = '.btn-gold,.btn-outline,.btn-sm,.btn,.td-new,.td-fab,.sd-go,.confirm-btn,.whatsapp-btn,.tb-go,.bless-go,.ig-link,.wa-link,.mx-cta a,.fab,.mx-fab';
  var PRIMARY = '.btn-gold,.confirm-btn,.whatsapp-btn,.tb-go,.td-new,.td-fab,.sd-go,.mx-cta a,.mx-fab,.fab';

  // ── CSS (يُعاد توليده عند تغيّر الإعدادات) ──
  function css(){
    var c = '';
    c += '#lb,.tk-ov,.tk-ed-body,.modal{overscroll-behavior:contain}\n';   // لا «سحب للتحديث» داخل النوافذ
    if(reduced()) return c;
    if(on('reveal') || on('stagger')) c += '.mx-h{opacity:0;transform:translateY(24px)}.mx-h.mx-st{transform:translateY(16px)}' +
      '.mx-h.mx-in{opacity:1;transform:none;transition:opacity .55s '+E+',transform .55s '+E+';transition-delay:var(--mx-d,0ms)}\n';
    if(on('scaleIn')) c += '.mx-s{opacity:0;transform:scale(.9)}.mx-s.mx-in{opacity:1;transform:none;transition:opacity .4s '+E+',transform .4s '+SPRING+';transition-delay:var(--mx-d,0ms)}\n';
    if(on('imgMask')) c += '.mx-m{clip-path:inset(100% 0 0 0)}.mx-m.mx-in{clip-path:inset(0 0 0 0);transition:clip-path .6s '+E+';transition-delay:var(--mx-d,0ms)}\n';
    if(on('skeleton')) c += '.mx-kp{position:relative;overflow:hidden}.mx-kp::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);transform:translateX(100%);animation:mxSh 1.15s linear infinite}' +
      '.mx-kp.mx-ld::after{display:none}@keyframes mxSh{to{transform:translateX(-100%)}}\n';
    if(on('skeleton') || on('reveal')) c += 'img.mx-b{opacity:0;transform:scale(1.03);filter:blur(6px)}img.mx-b.mx-ld{opacity:1;transform:none;filter:none;transition:opacity .45s ease,transform .6s '+E+',filter .5s ease}\n';
    if(on('splitText')) c += '.mx-w{display:inline-block;opacity:0;transform:translateY(.45em)}.mx-split.mx-in .mx-w{opacity:1;transform:none;transition:opacity .5s '+E+',transform .5s '+E+';transition-delay:calc(var(--i) * 70ms + 80ms)}\n';
    if(on('highlight')) c += '.mx-hl{position:relative;display:inline-block}.mx-hl::after{content:"";position:absolute;inset-inline:0;bottom:-.3em;height:3px;border-radius:3px;background:var(--btn-sage,var(--gold,#9a6f66));transform:scaleX(0);transform-origin:right;pointer-events:none}' +
      'html[dir="ltr"] .mx-hl::after{transform-origin:left}.mx-hl.mx-in::after{transform:scaleX(1);transition:transform .6s '+E+' .15s}\n';
    if(on('progress')) c += '#mx-prog{position:fixed;top:0;inset-inline:0;height:3px;z-index:2147483000;pointer-events:none;background:var(--btn-sage,var(--gold,#9a6f66));transform:scaleX(0);transform-origin:right}' +
      'html[dir="ltr"] #mx-prog{transform-origin:left}@supports (animation-timeline:scroll()){#mx-prog{animation:mxProg linear both;animation-timeline:scroll(root)}@keyframes mxProg{to{transform:scaleX(1)}}}\n';
    if(on('toTop')) c += '#mx-top{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom,0px));inset-inline-start:16px;z-index:350;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.5);background:var(--card-g,#fff);color:var(--text,#333);box-shadow:var(--lift-sm,0 4px 12px rgba(0,0,0,.15));font-size:1.2rem;cursor:pointer;display:grid;place-items:center;opacity:0;transform:translateY(14px) scale(.9);pointer-events:none;transition:opacity .3s '+E+',transform .3s '+E+'}' +
      '#mx-top.show{opacity:1;transform:none;pointer-events:auto}body:has(.total-bar.show) #mx-top,body:has(.td-fab) #mx-top,body:has(.mx-cta.show) #mx-top{bottom:calc(92px + env(safe-area-inset-bottom,0px))}\n';
    if(on('smartHeader')) c += '.mx-hdr{transition:transform .3s '+E+',box-shadow .3s ease}.mx-hdr.mx-up{transform:translateY(-110%)}.mx-hdr.mx-sc{box-shadow:0 10px 26px -14px rgba(0,0,0,.35) !important;-webkit-backdrop-filter:blur(16px) saturate(1.2);backdrop-filter:blur(16px) saturate(1.2)}\n';
    // viewTrans: في theme.js (يجب أن يكون في <head> قبل أول رسم حتى تعمل انتقالات الصفحات)
    if(on('tap')) c += '@media (hover:none){'+BTN.split(',').map(function(b){ return b+':active'; }).join(',')+'{transform:scale(.96) !important;transition:transform .08s ease !important}' +
      '.package:active,.service:active,.category:active,.ph:active,.card[data-tk-open]:active,.sd-row:active,.sa-stat:active{transform:scale(.98) !important;transition:transform .08s ease !important}}' +
      BTN.split(',').concat(['.package','.service','.category','.ph']).join(',')+'{transition:transform .35s '+SPRING+'}\n';
    if(on('ripple')) c += '.mx-rw{position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;z-index:0}.mx-rp{position:absolute;border-radius:50%;background:currentColor;opacity:.22;transform:scale(0);animation:mxRp .55s '+E+' forwards;pointer-events:none}@keyframes mxRp{to{transform:scale(1);opacity:0}}\n';
    if(on('fab')) c += '.mx-fab{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom,0px));inset-inline-end:16px;z-index:340;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:#25d366;color:#fff;box-shadow:0 10px 22px -6px rgba(37,211,102,.55),0 2px 6px rgba(0,0,0,.18);transition:transform .35s '+E+'}' +
      '.mx-fab svg{width:28px;height:28px}.mx-fab::after,.fab.mx-pulse::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid currentColor;color:#25d366;opacity:0;animation:mxRing 4s '+E+' infinite 1.5s;pointer-events:none}.fab.mx-pulse::after{color:var(--sage-d,#789680)}' +
      '.mx-fab.mx-quiet::after,.fab.mx-quiet::after{display:none}@keyframes mxRing{0%{transform:scale(1);opacity:.75}22%{transform:scale(1.65);opacity:0}100%{transform:scale(1.65);opacity:0}}' +
      'body:has(.total-bar.show) .mx-fab,body:has(.mx-cta.show) .mx-fab{transform:translateY(-76px)}@media (hover:hover){.mx-fab:hover{transform:scale(1.06)}}\n';
    if(on('ctaBar')) c += '.mx-cta{position:fixed;inset-inline:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:330;display:flex;align-items:center;gap:.8rem;padding:.7rem .8rem .7rem 1rem;border-radius:18px;background:var(--card-g,#fff);border:1px solid rgba(255,255,255,.6);box-shadow:var(--float,0 12px 30px rgba(0,0,0,.18));transform:translateY(140%);transition:transform .45s '+E+';max-width:560px;margin:0 auto}' +
      '.mx-cta.show{transform:none}.mx-cta b{flex:1;font-size:.92rem;color:var(--text,#333)}.mx-cta a{flex:none;text-decoration:none;font-weight:800;color:#fff;background:var(--btn-sage,#86a08b);padding:.6rem 1.15rem;border-radius:12px}\n';
    if(on('kenBurns')) c += '.mx-kb{animation:mxKB 8s ease-out both;transform-origin:50% 40%}@keyframes mxKB{from{transform:scale(1)}to{transform:scale(1.08)}}\n';
    if(on('focusGlow')) c += 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]),select,textarea{transition:border-color .25s ease,box-shadow .25s ease}' +
      'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):focus,select:focus,textarea:focus{border-color:var(--sage-d,var(--gold,#789680)) !important;box-shadow:0 0 0 3px color-mix(in srgb,var(--sage-d,#789680) 26%,transparent),var(--sunk,none) !important;outline:none}\n';
    if(on('toastAnim')) c += '.nt-toast{top:calc(14px + env(safe-area-inset-top,0px));bottom:auto !important;transform:translate(-50%,-150%) !important;transition:opacity .3s ease,transform .45s '+SPRING+' !important}.nt-toast.show{transform:translate(-50%,0) !important}' +
      '.app-toast,#toast{top:calc(14px + env(safe-area-inset-top,0px)) !important;bottom:auto !important}.app-toast:not([hidden]),#toast:not([hidden]){animation:mxToast .45s '+SPRING+' both}' +
      '@keyframes mxToast{from{opacity:0;transform:translate(-50%,-120%)}to{opacity:1;transform:translate(-50%,0)}}#toast:not([hidden]){animation-name:mxToast2}@keyframes mxToast2{from{opacity:0;transform:translateY(-120%)}to{opacity:1;transform:none}}\n';
    if(on('success')) c += '.mx-ok{position:fixed;left:50%;top:50%;z-index:2147483001;display:grid;justify-items:center;gap:.6rem;padding:1.4rem 1.8rem;border-radius:22px;background:var(--card-g,#fff);box-shadow:var(--float,0 20px 40px rgba(0,0,0,.2));transform:translate(-50%,-50%) scale(.9);opacity:0;animation:mxOk 1.9s '+E+' forwards;pointer-events:none;color:var(--text,#333);font-weight:800;text-align:center}' +
      '.mx-ok svg{width:64px;height:64px}.mx-ok circle{stroke:var(--sage-d,#5f8a6c);stroke-dasharray:151;stroke-dashoffset:151;animation:mxDraw .5s '+E+' .1s forwards}.mx-ok path{stroke:var(--sage-d,#5f8a6c);stroke-dasharray:40;stroke-dashoffset:40;animation:mxDraw .35s '+E+' .5s forwards}' +
      '@keyframes mxDraw{to{stroke-dashoffset:0}}@keyframes mxOk{0%{opacity:0;transform:translate(-50%,-50%) scale(.9)}12%,80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.96)}}' +
      '.mx-busy{position:relative;color:transparent !important}.mx-busy::before{content:"";position:absolute;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2.5px solid rgba(255,255,255,.45);border-top-color:#fff;animation:mxSpin .7s linear infinite}@keyframes mxSpin{to{transform:rotate(360deg)}}\n';
    if(on('bottomSheet')) c += '@media (max-width:640px){.tk-ov{align-items:flex-end !important;justify-content:stretch !important}.tk-ed{width:100% !important;height:auto !important;max-height:92vh;border-radius:22px 22px 0 0;border-inline-start:0 !important;border-top:5px solid var(--tc);animation:mxSheet .38s '+E+' !important}' +
      '.tk-ed::before{content:"";display:block;flex:none;width:44px;height:5px;border-radius:9px;background:var(--border,#ccc);margin:8px auto 2px}}@keyframes mxSheet{from{transform:translateY(100%)}to{transform:none}}\n';
    return c;
  }
  function styleEl(){ var s = D.getElementById('mx-css'); if(!s){ s = D.createElement('style'); s.id = 'mx-css'; (D.head || D.documentElement).appendChild(s); } return s; }

  // ── الظهور عند التمرير (مرة واحدة) ──
  var io = null, seen = (typeof WeakSet === 'function') ? new WeakSet() : null;
  function reveal(el){ el.classList.add('mx-in'); if(io) io.unobserve(el); setTimeout(function(){ el.style.willChange = ''; }, 900); }
  function watch(el, cls, delay){
    if(!el || (seen && seen.has(el))) return;
    if(el.closest && el.closest('.cf,.cf-c')) return;   // معرض بوابة العميل (Flow): بلا أي حركة إضافية
    if(seen) seen.add(el);
    el.classList.add(cls); if(delay) el.style.setProperty('--mx-d', delay + 'ms'); el.style.willChange = 'transform,opacity';
    if(!io) return reveal(el);
    io.observe(el);
  }
  var PUB_HEAD = 'h1,h2,h3,header p.sub,.section-title,.sub,.hero h2,.hero p,.wrap>p,.intro,.top h1,.top .sub,.site-foot';
  var PUB_LIST = [['.categories','.category'],['#packagesList','.package'],['#servicesList','.service'],['#grid','.ph'],['.cards','.card'],['main#app','section,.card,.sess-card'],['.tabs','.tab']];
  function scan(root){
    if(DASH) return;
    root = root || D;
    if(on('reveal')) $$(PUB_HEAD, root).forEach(function(el){ if(!el.classList.contains('mx-split') && !el.closest('.mx-h,#lb,.tk-ov,.bless-ov,.nt-toast,#totalBar,.total-bar,.gallery') && !el.querySelector('.mx-h')) watch(el, 'mx-h'); });
    if(on('stagger')) PUB_LIST.forEach(function(p){ $$(p[0], root).concat(root.matches && root.matches(p[0]) ? [root] : []).forEach(function(box){
      $$(p[1], box).forEach(function(it, i){ if(it.parentElement && it.parentElement.closest(p[0]) === box){ it.classList.add('mx-st'); watch(it, 'mx-h', Math.min(i, 10) * 80); } }); }); });
    if(on('scaleIn')) $$('.badge,.section-title .num,.category .icon,.pkg-badge,.popular-badge,.package .badge', root).forEach(function(el, i){ watch(el, 'mx-s', (i % 6) * 60); });
    if(on('imgMask')) $$('#grid img,.hero img', root).forEach(function(im, i){ watch(im, 'mx-m', (i % 6) * 70); });   // ليس معرض بوابة العميل (.cf) — يبقى بسيطًا
    if(on('highlight')) $$('.section-title h2', root).forEach(function(h){ watch(h, 'mx-hl'); });
    if(on('skeleton') || on('reveal')) $$('#grid img,.hero img', root).forEach(function(im){
      if(im.dataset.mxB) return; im.dataset.mxB = 1;
      var box = on('skeleton') ? im.parentElement : null;
      if(im.complete && im.naturalWidth) return;   // محمّلة مسبقًا: لا داعي
      im.classList.add('mx-b'); if(box) box.classList.add('mx-kp');
      var done = function(){ im.classList.add('mx-ld'); if(box) box.classList.add('mx-ld'); };
      im.addEventListener('load', done, {once:true}); im.addEventListener('error', done, {once:true});
    });
    if(on('kenBurns')) $$('.hero img', root).forEach(function(im){ var p = im.parentElement; if(p && p.offsetWidth > 220 && getComputedStyle(p).overflow === 'hidden') im.classList.add('mx-kb'); });
    if(on('video')) $$('video', root).forEach(watchVideo);
  }
  // عنوان الصفحة كلمة كلمة (لا نقسم العربية إلى حروف)
  function splitHero(){
    if(DASH || !on('splitText')) return;
    var h = D.querySelector('header h1, .top h1, .hero h1, main h1');
    if(!h || h.dataset.mxSplit || h.children.length) return;
    h.dataset.mxSplit = 1; h.setAttribute('aria-label', h.textContent.trim());
    var words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map(function(w, i){ return '<span class="mx-w" aria-hidden="true" style="--i:' + i + '">' + w.replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }) + '</span>'; }).join(' ');
    h.classList.add('mx-split');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ h.classList.add('mx-in'); }); });
  }
  // فيديو: يعمل صامتًا عند ظهور 50% ويتوقف خارج الشاشة
  var vio = null;
  function watchVideo(v){ if(v.dataset.mxV) return; v.dataset.mxV = 1; v.muted = true; v.playsInline = true;
    if(!vio) vio = new IntersectionObserver(function(es){ es.forEach(function(e){ var x = e.target; if(e.isIntersecting){ var p = x.play(); if(p && p.catch) p.catch(function(){}); } else x.pause(); }); }, {threshold:.5});
    vio.observe(v); }

  // ── شريط التقدّم + زر الأعلى + الهيدر الذكي ──
  var prog = null, top = null, sent = null, hdr = null, lastY = 0, ticking = false;
  function ensureUi(){
    if(on('progress') && !prog){ prog = D.createElement('div'); prog.id = 'mx-prog'; prog.setAttribute('aria-hidden', 'true'); D.body.appendChild(prog); }
    if(prog) prog.hidden = !on('progress');
    if(on('toTop') && !top){
      top = D.createElement('button'); top.id = 'mx-top'; top.type = 'button'; top.setAttribute('aria-label', 'الرجوع للأعلى'); top.innerHTML = '↑';
      top.addEventListener('click', function(){ W.scrollTo({top:0, behavior: reduced() ? 'auto' : 'smooth'}); });
      D.body.appendChild(top);
      sent = D.createElement('div'); sent.style.cssText = 'position:absolute;top:600px;left:0;width:1px;height:1px;pointer-events:none';
      D.body.appendChild(sent);
      if('IntersectionObserver' in W) new IntersectionObserver(function(es){ var e = es[0]; top.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0); }).observe(sent);
    }
    if(top) top.hidden = !on('toTop');
    if(!hdr){ hdr = $$('body>nav,body>header,.top-bar,header').filter(function(el){ var p = getComputedStyle(el).position; return p === 'sticky' || p === 'fixed'; })[0] || null; if(hdr) hdr.classList.add('mx-hdr'); }
    if(on('ctaBar')) ctaBar();
    if(on('fab')) fab(); else { var f = D.getElementById('mx-fab'); if(f) f.remove(); }
  }
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      var y = W.scrollY || D.documentElement.scrollTop || 0;
      if(prog && on('progress') && !(W.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))){
        var h = D.documentElement.scrollHeight - innerHeight; prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
      }
      if(hdr && on('smartHeader')){
        hdr.classList.toggle('mx-sc', y > 50);
        var focusIn = hdr.contains(D.activeElement) && D.activeElement !== D.body;
        if(y > lastY + 6 && y > 140 && !focusIn) hdr.classList.add('mx-up');
        else if(y < lastY - 6 || y < 140) hdr.classList.remove('mx-up');
      } else if(hdr) hdr.classList.remove('mx-up', 'mx-sc');
      lastY = y;
    });
  }
  W.addEventListener('scroll', onScroll, {passive:true});

  // ── زر واتساب العائم (يتوقف نبضه بعد أول ضغطة) ──
  function quiet(el){ try{ if(localStorage.getItem('mx-fab-tap')) el.classList.add('mx-quiet'); }catch(e){} el.addEventListener('click', function(){ el.classList.add('mx-quiet'); try{ localStorage.setItem('mx-fab-tap', '1'); }catch(e){} }); }
  function fab(){
    if(DASH) return;
    var own = D.querySelector('.fab');
    if(own){ if(!own.classList.contains('mx-pulse')){ own.classList.add('mx-pulse'); quiet(own); } return; }
    if(D.getElementById('mx-fab')) return;
    var wa = D.querySelector('a[href*="wa.me/"]'); if(!wa) return;
    var a = D.createElement('a'); a.id = 'mx-fab'; a.className = 'mx-fab'; a.href = wa.href.split('?')[0]; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', 'تواصل عبر واتساب');
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.7a11.9 11.9 0 0 0 5.7 1.5c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 0 1 2.1 12C2.1 6.5 6.5 2 12 2s9.9 4.5 9.9 9.9-4.4 9.9-9.9 9.9zm5.4-7.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.1 8.1 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>';
    quiet(a); D.body.appendChild(a);
  }
  // ── شريط «احجز الآن» بعد تجاوز رأس الصفحة (الصفحات التي تحمل data-mx-cta) ──
  function ctaBar(){
    var href = D.body.getAttribute('data-mx-cta'); if(DASH || !href || D.querySelector('.mx-cta')) return;
    var b = D.createElement('div'); b.className = 'mx-cta'; b.setAttribute('role', 'complementary');
    b.innerHTML = '<b>جاهز لحجز جلستك؟</b><a href="' + href.replace(/"/g, '') + '">احجز الآن</a>';
    D.body.appendChild(b);
    var s = D.createElement('div'); s.style.cssText = 'position:absolute;top:70vh;left:0;width:1px;height:1px;pointer-events:none'; D.body.appendChild(s);
    if('IntersectionObserver' in W) new IntersectionObserver(function(es){ var e = es[0]; b.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0); }).observe(s);
  }

  // ── اللمس: موجة من نقطة اللمس + اهتزاز خفيف للأزرار الرئيسية ──
  D.addEventListener('pointerdown', function(e){
    if(!on('ripple') || e.button > 0) return;
    var b = e.target.closest && e.target.closest(BTN); if(!b || b.disabled) return;
    if(getComputedStyle(b).position === 'static') b.style.position = 'relative';
    var w = b.querySelector(':scope>.mx-rw'); if(!w){ w = D.createElement('span'); w.className = 'mx-rw'; w.setAttribute('aria-hidden', 'true'); b.appendChild(w); }
    var r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2, s = D.createElement('span');
    s.className = 'mx-rp'; s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
    w.appendChild(s); setTimeout(function(){ s.remove(); }, 650);
  }, {passive:true});
  D.addEventListener('click', function(e){
    if(!S.haptic) return;
    var b = e.target.closest && e.target.closest(PRIMARY); if(!b || b.disabled) return;
    try{ if(navigator.vibrate) navigator.vibrate(10); }catch(x){}
  }, true);

  // ── سحب الإشعار للأعلى لإغلاقه ──
  var tY = null, tEl = null;
  D.addEventListener('touchstart', function(e){ if(!on('toastAnim')) return; var t = e.target.closest && e.target.closest('.nt-toast.show,.app-toast:not([hidden]),#toast:not([hidden])'); if(t){ tEl = t; tY = e.touches[0].clientY; } }, {passive:true});
  D.addEventListener('touchend', function(e){ if(!tEl) return; var dy = e.changedTouches[0].clientY - tY;
    if(dy < -25){ if(tEl.classList.contains('nt-toast')) tEl.classList.remove('show'); else tEl.hidden = true; } tEl = null; }, {passive:true});

  // ── نافذة المهمة كـ Bottom Sheet على الجوال: السحب للأسفل يغلقها ──
  var sY = null, sEd = null;
  D.addEventListener('touchstart', function(e){ if(!on('bottomSheet') || innerWidth > 640) return; var ed = e.target.closest && e.target.closest('.tk-ed'); if(!ed) return;
    var body = ed.querySelector('.tk-ed-body'); if(body && body.contains(e.target) && body.scrollTop > 0) return; sEd = ed; sY = e.touches[0].clientY; }, {passive:true});
  D.addEventListener('touchmove', function(e){ if(!sEd) return; var dy = e.touches[0].clientY - sY; if(dy > 0){ sEd.style.transform = 'translateY(' + dy + 'px)'; sEd.style.transition = 'none'; } }, {passive:true});
  D.addEventListener('touchend', function(e){ if(!sEd) return; var dy = e.changedTouches[0].clientY - sY, ed = sEd; sEd = null;
    ed.style.transition = 'transform .3s ' + E;
    if(dy > 110){ ed.style.transform = 'translateY(100%)'; setTimeout(function(){ var c = ed.querySelector('[data-tk-close]'); if(c) c.click(); }, 250); }
    else ed.style.transform = ''; }, {passive:true});

  // ── عدّ الأرقام في لوحة التحكم عند ظهورها (لا يتكرر لنفس القيمة) ──
  var counted = {}, cio = null;
  function countScan(){
    if(!DASH || !on('countUp') || !('IntersectionObserver' in W)) return;
    if(!cio) cio = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ cio.unobserve(e.target); countUp(e.target); } }); }, {threshold:.4});
    $$('.bz-kpi b,.sa-stat b,.td-stats b,.td-stat b,.kpi b,.stat b').forEach(function(el){
      if(el.dataset.mxC) return; el.dataset.mxC = 1;
      var txt = el.textContent.trim(), k = txt + '|' + (el.parentElement && el.parentElement.textContent.length);
      if(counted[k] && Date.now() - counted[k] < 120000) return;
      counted[k] = Date.now(); cio.observe(el);
    });
  }
  function countUp(el){
    var txt = el.textContent, m = /^([^\d]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(txt); if(!m) return;
    var raw = m[2], end = parseFloat(raw.replace(/,/g, '')), dec = (raw.split('.')[1] || '').length, comma = raw.indexOf(',') > -1;
    if(!(end > 0)) return;
    var t0 = performance.now(), dur = 1500, fmt = function(v){ var s = v.toFixed(dec); if(comma){ var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); } return m[1] + s + m[3]; };
    (function step(now){ var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 5); el.textContent = fmt(end * e); if(p < 1) requestAnimationFrame(step); else el.textContent = txt; })(t0);
  }

  // ── واجهة برمجية للصفحات: MX.done(زر، رسالة) ← دائرة تحميل ثم علامة صح مرسومة ──
  W.MX = {
    on: function(k){ return on(k); },
    done: function(btn, msg){
      if(!on('success')) return;
      if(btn){ btn.classList.add('mx-busy'); setTimeout(function(){ btn.classList.remove('mx-busy'); }, 650); }
      setTimeout(function(){
        var o = D.createElement('div'); o.className = 'mx-ok'; o.setAttribute('role', 'status');
        o.innerHTML = '<svg viewBox="0 0 52 52" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg><span>' + String(msg || 'تم ✓').replace(/[&<>]/g, '') + '</span>';
        D.body.appendChild(o); setTimeout(function(){ o.remove(); }, 2000);
      }, btn ? 500 : 0);
    }
  };

  // ── التهيئة وإعادة التهيئة عند تغيير الإعدادات (المعاينة في لوحة التحكم) ──
  function cfg(){ var t = W.SiteTheme && W.SiteTheme.current && W.SiteTheme.current(); S = (t && t.mx) || {}; }
  var mo = null;
  function init(){
    cfg();
    styleEl().textContent = css();
    if(!io && 'IntersectionObserver' in W) io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) reveal(e.target); }); }, {threshold:.15, rootMargin:'0px 0px -6% 0px'});
    if(D.body){ ensureUi(); splitHero(); scan(D); countScan(); onScroll(); }
    if(!mo && 'MutationObserver' in W && D.body){
      var pend = false;
      mo = new MutationObserver(function(){ if(pend) return; pend = true; requestAnimationFrame(function(){ pend = false; scan(D); countScan(); }); });
      mo.observe(D.body, {childList:true, subtree:true});
    }
  }
  if(D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
  D.addEventListener('sitetheme', init);
  if(RM && RM.addEventListener) RM.addEventListener('change', init);
})();
