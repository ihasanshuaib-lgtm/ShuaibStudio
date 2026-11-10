// ═══ ألوان الموقع المخصّصة (تُختار من main.html ← الإعدادات ← «ألوان الموقع») ═══
// تُطبَّق على كل الصفحات (الحجز، لوحة التحكم، الموظفين، البوابة، الصور…) في الوضع الفاتح فقط.
// المصدر: Supabase site_config (key='theme', قيمته {on,bg,btn,accent}) + نسخة في localStorage لتظهر فورًا.
// الاستعمال: <script src="theme.js" data-mode="class"></script>
//   data-mode="class" → الصفحة تستعمل body.light-mode للوضع الفاتح (index.html, portal.html)
//   بدونه            → الوضع الداكن عبر html[data-theme="dark"] (main.html) أو لا يوجد وضع داكن
(function(){
  var KEY = 'site-theme';
  var script = document.currentScript;
  var MODE = (script && script.getAttribute('data-mode')) || 'attr';

  function rgb(h){ h = String(h || '').replace('#',''); if(h.length === 3) h = h.replace(/./g,'$&$&');
    var n = parseInt(h,16); return isNaN(n) || h.length !== 6 ? null : [n>>16 & 255, n>>8 & 255, n & 255]; }
  function hex(a){ return '#' + a.map(function(x){ x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function mix(c, w, t){ var a = rgb(c), b = w === 'w' ? [255,255,255] : [0,0,0]; if(!a) return c; return hex(a.map(function(x,i){ return x + (b[i]-x)*t; })); }
  function lum(c){ var a = rgb(c); if(!a) return .5; a = a.map(function(x){ x /= 255; return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); }); return .2126*a[0] + .7152*a[1] + .0722*a[2]; }
  var ok = function(c){ return /^#[0-9a-f]{6}$/i.test(c || ''); };

  var FONTS = {
    tajawal:['Tajawal','Tajawal:wght@400;500;700;800'], plex:['IBM Plex Sans Arabic','IBM+Plex+Sans+Arabic:wght@400;500;600;700'],
    cairo:['Cairo','Cairo:wght@400;500;600;700'], almarai:['Almarai','Almarai:wght@400;700;800'],
    readex:['Readex Pro','Readex+Pro:wght@300;400;500;600;700'], noto:['Noto Kufi Arabic','Noto+Kufi+Arabic:wght@400;500;600;700']
  };
  function contrast(a, b){ var x = lum(a), y = lum(b); return (Math.max(x,y) + .05) / (Math.min(x,y) + .05); }
  function fontLink(f){
    var id = 'site-theme-font', l = document.getElementById(id), F = FONTS[f];
    if(!F){ if(l) l.remove(); return; }
    var href = 'https://fonts.googleapis.com/css2?family=' + F[1] + '&display=swap';
    if(!l){ l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; (document.head || document.documentElement).appendChild(l); }
    if(l.href !== href) l.href = href;
  }
  // الحقول: on, bg, card, btn, btnText ('' = تلقائي), accent, text, muted, radius ('sharp'|''|'round'),
  //         shadow ('flat'|''|'deep'), bgStyle (''=متدرّج|'solid'), font (مفتاح من FONTS أو ''), scale (90–115)
  function css(t){
    if(!t || !t.on){ fontLink(''); return ''; }
    var S = MODE === 'class' ? 'html body.light-mode, html body#nt.light-mode' : 'html:not([data-theme="dark"]) body';
    var SS = S.split(',').map(function(x){ return x.trim(); });
    var each = function(sub, decl){ return SS.map(function(s){ return sub.split(',').map(function(q){ return s + (q.trim() ? ' ' + q.trim() : ''); }).join(','); }).join(',') + '{' + decl + '}\n'; };
    var v = [], extra = '';
    var B = ok(t.bg) ? t.bg : null, dark = B && lum(B) < .18;
    var sh = t.shadow === 'flat' ? 0 : t.shadow === 'deep' ? 1.7 : 1;
    if(B){
      var sd = mix(B,'b', dark ? .35 : .12 * (sh || 1)), sl = mix(B,'w', dark ? .08 : .7);
      v.push('--dark:'+B, '--bg:'+B, '--bg-soft:'+mix(B,'b',.04), '--off:'+mix(B,'b',.04), '--surface:'+mix(B,'b',.025),
        '--border:'+mix(B,'b',.1), '--line:'+mix(B,'b',.1), '--sh-d:'+sd, '--sh-l:'+sl);
      if(dark) v.push('--text:'+mix(B,'w',.85), '--muted:'+mix(B,'w',.55), '--white:'+mix(B,'w',.95), '--text-dim:'+mix(B,'w',.55));
      extra += each('', t.bgStyle === 'solid' ? 'background:'+B+' !important' : 'background:radial-gradient(ellipse at 50% 0%,'+mix(B,'w',.4)+' 0%,'+B+' 55%,'+mix(B,'b',.05)+' 100%) fixed !important');
    }
    if(B || t.shadow){
      var base = B || '#efebe6', d1 = mix(base,'b', dark ? .35 : .12 * (sh || 1)), l1 = mix(base,'w', dark ? .08 : .7);
      if(sh === 0) v.push('--lift:0 1px 2px rgba(0,0,0,.08)', '--lift-sm:0 1px 2px rgba(0,0,0,.07)', '--float:0 4px 12px rgba(0,0,0,.08)', '--sunk:inset 0 0 0 1px '+mix(base,'b',.12));
      else { var k = sh; v.push('--lift:'+6*k+'px '+6*k+'px '+14*k+'px '+d1+',-'+6*k+'px -'+6*k+'px '+14*k+'px '+l1,
        '--lift-sm:'+3*k+'px '+3*k+'px '+8*k+'px '+d1+',-'+3*k+'px -'+3*k+'px '+8*k+'px '+l1,
        '--float:'+10*k+'px '+12*k+'px '+24*k+'px '+d1+',-'+8*k+'px -'+8*k+'px '+18*k+'px '+l1,
        '--sunk:inset '+3*k+'px '+3*k+'px '+7*k+'px '+d1+',inset -'+3*k+'px -'+3*k+'px '+7*k+'px '+l1); }
    }
    var CD = ok(t.card) ? t.card : (B ? null : null);
    if(CD) v.push('--card:'+CD, '--card-hover:'+mix(CD,'b',.03), '--panel:'+CD, '--card-g:linear-gradient(145deg,'+mix(CD,'w',.25)+','+mix(CD,'b',.03)+')');
    else if(B) v.push('--card:'+mix(B,'w',.25), '--card-hover:'+mix(B,'w',.12), '--panel:'+mix(B,'w',.2), '--card-g:linear-gradient(145deg,'+mix(B,'w',.35)+','+mix(B,'b',.03)+')');
    if(ok(t.text)) v.push('--text:'+t.text, '--white:'+mix(t.text,'b',.15));
    if(ok(t.muted)) v.push('--muted:'+t.muted, '--text-dim:'+t.muted);
    if(ok(t.btn)){
      var C = t.btn;
      v.push('--btn-sage:linear-gradient(145deg,'+mix(C,'w',.12)+','+mix(C,'b',.06)+')', '--sage:'+C, '--sage-d:'+mix(C,'b',.15),
        '--sage-dd:'+mix(C,'b',.28), '--accent:'+mix(C,'b',.15), '--green:'+mix(C,'b',.15));
      var BT = ok(t.btnText) ? t.btnText : (lum(C) > .55 ? mix(C,'b',.75) : null);   // تلقائي: نص داكن على زر فاتح
      if(BT) extra += each('.btn-gold,.confirm-btn,.whatsapp-btn,.tb-go,.bless-go,.th-demo-btn', 'color:'+BT+' !important;text-shadow:none !important');
    }
    if(ok(t.accent)){
      var A = t.accent;
      v.push('--gold:'+A, '--rose-d:'+A, '--rose:'+mix(A,'w',.2), '--gold-light:'+mix(A,'b',.12), '--gold-dim:'+mix(A,'w',.55));
    }
    if(t.radius === 'sharp' || t.radius === 'round'){
      var r = t.radius === 'sharp' ? '4px' : '24px', rb = t.radius === 'sharp' ? '4px' : '999px';
      extra += each('.card,.sd-c,.sa-g,.sa-stat,.bz-kpi,.modal,.modal-box,.ct-item,.th-pick,.package,.service,.category,.summary-card,.info-card,.gallery-card,.sess,.up,.td-sum,.td-add', 'border-radius:'+r+' !important');
      extra += each('.btn-gold,.btn-outline,.btn-sm,.confirm-btn,.whatsapp-btn,.tb-go,.td-new,.sd-go,.bz-in,input:not([type=checkbox]):not([type=radio]):not([type=color]):not([type=range]),select,textarea', 'border-radius:'+(t.radius === 'sharp' ? r : '16px')+' !important');
      extra += each('.btn-gold,.btn-outline,.btn-sm,.td-new,.sd-go,.confirm-btn,.whatsapp-btn', 'border-radius:'+rb+' !important');
    }
    if(FONTS[t.font]){
      fontLink(t.font);
      extra += each('', "font-family:'"+FONTS[t.font][0]+"',system-ui,sans-serif !important");
      extra += each('button,input,select,textarea,.bz-in,p,span,div,label,td,th,li,small,b,a', 'font-family:inherit');
    } else fontLink('');
    var sc = +t.scale;
    if(sc >= 85 && sc <= 120 && sc !== 100) extra += (MODE === 'class' ? 'html:has(body.light-mode)' : 'html:not([data-theme="dark"])') + '{font-size:'+sc+'% !important}\n';
    if(!v.length && !extra) return '';
    var decl = v.map(function(x){ return x + ' !important'; }).join(';');
    return each('', decl) + extra;
  }

  function el(){
    var st = document.getElementById('site-theme-css');
    if(!st){ st = document.createElement('style'); st.id = 'site-theme-css'; }
    // آخر عنصر في الصفحة حتى يتغلّب على أي <style> قبله
    var host = document.body || document.head || document.documentElement;
    if(st.parentNode !== host || st !== host.lastElementChild) host.appendChild(st);
    return st;
  }
  var current = null;
  function apply(t){ current = t || null; el().textContent = css(current); }
  function cache(t){ try{ t ? localStorage.setItem(KEY, JSON.stringify(t)) : localStorage.removeItem(KEY); }catch(e){} }

  var cached = null;
  try{ cached = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){}
  apply(cached);
  document.addEventListener('DOMContentLoaded', function(){ apply(current); });

  function fetchRemote(){
    var c = window.SB;
    if(!c || !c.key || !window.fetch) return;
    fetch(c.url + '/rest/v1/site_config?key=eq.theme&select=value', {headers:{apikey:c.key, Authorization:'Bearer ' + c.key}})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(rows){
        if(!rows) return;
        var v = (rows[0] && rows[0].value) || null;
        if(JSON.stringify(v) === JSON.stringify(current)) return;
        if(window.SiteTheme && window.SiteTheme.preview) return;   // المالك يعاين ألوانًا لم تُحفظ بعد
        cache(v); apply(v);
      }).catch(function(){});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchRemote); else fetchRemote();

  window.SiteTheme = {apply: apply, cache: cache, css: css, current: function(){ return current; }, preview: false, mix: mix, lum: lum, contrast: contrast, FONTS: FONTS};
})();
