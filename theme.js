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

  function css(t){
    if(!t || !t.on) return '';
    var S = MODE === 'class' ? 'html body.light-mode, html body#nt.light-mode' : 'html:not([data-theme="dark"]) body';
    var v = [], extra = '';
    if(ok(t.bg)){
      var B = t.bg, dark = lum(B) < .18;
      var sd = mix(B,'b', dark ? .35 : .12), sl = mix(B,'w', dark ? .08 : .7);
      v.push('--dark:'+B, '--bg:'+B, '--bg-soft:'+mix(B,'b',.04), '--off:'+mix(B,'b',.04), '--surface:'+mix(B,'b',.025),
        '--card:'+mix(B,'w',.25), '--card-hover:'+mix(B,'w',.12), '--panel:'+mix(B,'w',.2),
        '--border:'+mix(B,'b',.1), '--line:'+mix(B,'b',.1), '--sh-d:'+sd, '--sh-l:'+sl,
        '--lift:6px 6px 14px '+sd+',-6px -6px 14px '+sl, '--lift-sm:3px 3px 8px '+sd+',-3px -3px 8px '+sl,
        '--float:10px 12px 24px '+sd+',-8px -8px 18px '+sl,
        '--sunk:inset 3px 3px 7px '+sd+',inset -3px -3px 7px '+sl,
        '--card-g:linear-gradient(145deg,'+mix(B,'w',.35)+','+mix(B,'b',.03)+')');
      if(dark) v.push('--text:'+mix(B,'w',.85), '--muted:'+mix(B,'w',.55), '--white:'+mix(B,'w',.95), '--text-dim:'+mix(B,'w',.55));
      extra += S.split(',').map(function(s){ return s + '{background:radial-gradient(ellipse at 50% 0%,'+mix(B,'w',.4)+' 0%,'+B+' 55%,'+mix(B,'b',.05)+' 100%) fixed !important}'; }).join('\n');
    }
    if(ok(t.btn)){
      var C = t.btn;
      v.push('--btn-sage:linear-gradient(145deg,'+mix(C,'w',.12)+','+mix(C,'b',.06)+')', '--sage:'+C, '--sage-d:'+mix(C,'b',.15),
        '--sage-dd:'+mix(C,'b',.28), '--accent:'+mix(C,'b',.15), '--green:'+mix(C,'b',.15));
      if(lum(C) > .55){   // زر فاتح جدًا: نص داكن ليبقى مقروءًا
        var dk = mix(C,'b',.75);
        extra += '\n' + S.split(',').map(function(s){ s = s.trim();
          return s+' .btn-gold,'+s+' .confirm-btn,'+s+' .whatsapp-btn,'+s+' .tb-go,'+s+' .bless-go,'+s+' .td-tabs button.on{color:'+dk+' !important;text-shadow:none !important}'; }).join('\n');
      }
    }
    if(ok(t.accent)){
      var A = t.accent;
      v.push('--gold:'+A, '--rose-d:'+A, '--rose:'+mix(A,'w',.2), '--gold-light:'+mix(A,'b',.12), '--gold-dim:'+mix(A,'w',.55));
    }
    if(!v.length && !extra) return '';
    var decl = v.map(function(x){ return x + ' !important'; }).join(';');
    return S.split(',').map(function(s){ return s.trim() + '{' + decl + '}'; }).join('\n') + '\n' + extra;
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

  window.SiteTheme = {apply: apply, cache: cache, css: css, current: function(){ return current; }, preview: false};
})();
