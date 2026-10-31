import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'src');
const out = path.join(root, 'dist');

function unwrap(text, kind) {
  const start = kind === 'client'
    ? 'export const CLIENT = String.raw`'
    : kind === 'css'
      ? 'export const CSS = `'
      : 'export const HTML = `';
  const i = text.indexOf(start);
  if (i < 0) throw new Error(`Cannot find ${kind} export wrapper`);
  const bodyStart = i + start.length;
  const end = text.lastIndexOf('`;');
  if (end < bodyStart) throw new Error(`Cannot find ${kind} export terminator`);
  return text.slice(bodyStart, end);
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

const [uiSource, cssSource, clientSource] = await Promise.all([
  fs.readFile(path.join(src, 'ui.js'), 'utf8'),
  fs.readFile(path.join(src, 'styles.js'), 'utf8'),
  fs.readFile(path.join(src, 'client.js'), 'utf8')
]);

const parityPatch = `<style>
.genreDirectoryControls{display:flex;align-items:center;gap:12px;justify-content:space-between;margin:4px 0 14px;padding:12px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.genreCountBox{min-width:150px}.genreCountBox span{display:block;color:var(--muted);font-size:10px}.genreCountBox b{font-family:Georgia,'Noto Serif Thai',serif;font-size:22px}.genreDirectoryControls input{flex:1;max-width:430px;padding:9px 12px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink)}
.readerParityExtras{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin:28px 0 4px;font-family:Inter,system-ui,sans-serif;font-size:11px}.readerParityExtras button{border:1px solid color-mix(in srgb,var(--readerInk) 16%,transparent);background:transparent;color:var(--readerInk);border-radius:999px;padding:8px 12px;cursor:pointer}.autoBuyLabel{display:flex;align-items:center;gap:7px;color:color-mix(in srgb,var(--readerInk) 78%,transparent)}.autoBuyLabel input{accent-color:#b07c39}.autoBuyNote{width:100%;text-align:center;font-size:9px;opacity:.62}
@media(max-width:620px){.genreDirectoryControls{align-items:stretch;flex-direction:column}.genreDirectoryControls input{max-width:none;width:100%}.genreCountBox{min-width:0}.readerParityExtras{align-items:flex-start;flex-direction:column}.autoBuyNote{text-align:left}}
</style><script>(function(){
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function mapVip(){document.querySelectorAll('.vipBtn[data-act="vip"]').forEach(function(b){b.dataset.act='wallet';b.title='Coin packages'})}
function openRegister(){var modal=document.querySelector('#modal'),body=document.querySelector('#modalBody');if(!modal||!body)return;body.innerHTML='<div class="authMark">A</div><h2 class="center">Create an Account</h2><p class="muted center">สมัครสมาชิกฟรีเพื่อเริ่มอ่านและบันทึกประวัติ</p><button class="googleBtn" data-google>G&nbsp;&nbsp; Continue with Google</button><div class="or"><span>OR WITH EMAIL</span></div><label class="fieldLabel">Username</label><input id="registerUsername" class="field" placeholder="เช่น astra_reader" required><label class="fieldLabel">Email Address</label><input id="registerEmail" class="field" type="email" placeholder="name@example.com" required><label class="fieldLabel">Password</label><input id="registerPassword" class="field" type="password" placeholder="อย่างน้อย 10 ตัวอักษร" required><button class="btn primary full" style="margin-top:14px" data-register-submit>Create Account</button><p class="center small">มีบัญชีอยู่แล้ว? <button class="textBtn" data-register-back>เข้าสู่ระบบ</button></p><div id="registerResult"></div>';modal.classList.add('show')}
var genreTimer=null;
function enhanceGenres(){if(location.pathname!=='/genres')return;var toolbar=document.querySelector('.contentMain .toolbar'),grid=document.querySelector('.contentMain .grid');if(!toolbar||!grid||document.querySelector('#genreDirectorySearch'))return;var headerSearch=document.querySelector('#search'),q=headerSearch&&headerSearch.value||'',count=grid.querySelectorAll('.card').length,box=document.createElement('section');box.className='genreDirectoryControls';box.innerHTML='<div class="genreCountBox"><span>นิยายในหมวดนี้</span><b>'+count+' เรื่อง</b></div><input id="genreDirectorySearch" aria-label="ค้นหาในหมวด" placeholder="ค้นหาชื่อนิยาย หรือผู้เขียนในหมวด..." value="'+esc(q)+'">';toolbar.parentNode.insertBefore(box,toolbar)}
async function enhanceReader(){var article=document.querySelector('[data-reader-id]');if(!article||article.dataset.parityEnhanced==='1')return;article.dataset.parityEnhanced='1';var id=article.dataset.readerId,nav=article.querySelector('.readerNav');if(!nav)return;var enabled=false;try{var r=await fetch('/api/reader/auto-purchase',{credentials:'same-origin'});if(r.ok)enabled=!!(await r.json()).auto_purchase}catch(e){}var extras=document.createElement('div');extras.className='readerParityExtras';extras.innerHTML='<button data-reader-toc="'+esc(id)+'">สารบัญตอน</button><label class="autoBuyLabel"><input id="autoPurchaseNext" type="checkbox" '+(enabled?'checked':'')+'> ซื้อตอนต่อไปอัตโนมัติ เมื่อ Coins พอ</label><div class="autoBuyNote">การตั้งค่านี้บันทึกกับบัญชี และจะหัก Coins เฉพาะเมื่อตอนถัดไปถูกล็อก</div>';nav.parentNode.insertBefore(extras,nav)}
async function maybeAutoUnlock(){var locked=document.querySelector('.lockedArticle'),parts=location.pathname.split('/').filter(Boolean);if(!locked||parts.length!==3||parts[0]!=='read'||locked.dataset.autoAttempt==='1')return;locked.dataset.autoAttempt='1';var bookId=parts[1],chapterNo=parts[2];try{var p=await fetch('/api/reader/auto-purchase',{credentials:'same-origin'});if(!p.ok)return;var d=await p.json();if(!d.auto_purchase)return;var u=await fetch('/api/coins/unlock/'+encodeURIComponent(bookId)+'/'+encodeURIComponent(chapterNo),{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:'{}'});if(u.ok)location.reload()}catch(e){}}
function enhance(){mapVip();enhanceGenres();enhanceReader();maybeAutoUnlock()}
enhance();new MutationObserver(function(){setTimeout(enhance,0)}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('input',function(e){if(e.target.id==='genreDirectorySearch'){var value=e.target.value,header=document.querySelector('#search');if(!header)return;header.value=value;clearTimeout(genreTimer);genreTimer=setTimeout(function(){header.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(function(){var x=document.querySelector('#genreDirectorySearch');if(x){x.focus();x.setSelectionRange(value.length,value.length)}},30)},180)}},true);
document.addEventListener('change',async function(e){if(e.target.id==='autoPurchaseNext'){try{var r=await fetch('/api/reader/auto-purchase',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({auto_purchase:e.target.checked})});if(!r.ok){e.target.checked=!e.target.checked;if(r.status===401)document.querySelector('[data-act="signin"]')?.click()}}catch(err){e.target.checked=!e.target.checked}}},true);
document.addEventListener('click',async function(e){var toc=e.target.closest('[data-reader-toc]');if(toc){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();location.href='/novel/'+encodeURIComponent(toc.dataset.readerToc);return}var reg=e.target.closest('[data-register]');if(reg){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openRegister();return}var back=e.target.closest('[data-register-back]');if(back){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();document.querySelector('#modal')?.classList.remove('show');setTimeout(function(){document.querySelector('[data-act="signin"]')?.click()},0);return}var submit=e.target.closest('[data-register-submit]');if(submit){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();var display_name=document.querySelector('#registerUsername')?.value.trim()||'',email=document.querySelector('#registerEmail')?.value.trim()||'',password=document.querySelector('#registerPassword')?.value||'';submit.disabled=true;submit.textContent='Creating...';try{var r=await fetch('/api/auth/register',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({display_name:display_name,email:email,password:password})});var d=await r.json().catch(function(){return {}});if(!r.ok)throw new Error(d.error||'request_failed');document.querySelector('#registerResult').innerHTML='<div class="demoNotice">สร้างบัญชีสำเร็จ กำลังเข้าสู่ระบบ...</div>';setTimeout(function(){location.reload()},350)}catch(err){var map={invalid_email:'E-mail ไม่ถูกต้อง',password_policy:'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร',invalid_display_name:'Username ต้องมีอย่างน้อย 2 ตัวอักษร',email_in_use:'E-mail นี้ถูกใช้แล้ว',rate_limited:'ลองใหม่ภายหลัง'};document.querySelector('#registerResult').innerHTML='<div class="demoNotice">'+esc(map[err.message]||'สร้างบัญชีไม่สำเร็จ')+'</div>';submit.disabled=false;submit.textContent='Create Account'}return}},true)
})();</script>`;
const html = unwrap(uiSource, 'html').replace('</body>', parityPatch + '</body>');
const css = unwrap(cssSource, 'css');
const js = unwrap(clientSource, 'client');

const proxy = `const UPSTREAM='https://astra-read.anuchit1tube168.workers.dev';
export default {async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname.startsWith('/api/')){
    const target=new URL(u.pathname+u.search,UPSTREAM);
    const h=new Headers(request.headers);
    h.set('Origin',UPSTREAM);h.set('Sec-Fetch-Site','same-origin');h.set('X-ASTRA-Entry','pages-static');
    const init={method:request.method,headers:h,redirect:'manual'};
    if(!['GET','HEAD'].includes(request.method))init.body=request.body;
    const r=await fetch(new Request(target,init));
    const oh=new Headers(r.headers);oh.set('X-ASTRA-Proxy','pages-static-api');oh.set('Cache-Control','no-store');
    return new Response(r.body,{status:r.status,statusText:r.statusText,headers:oh});
  }
  return env.ASSETS.fetch(request);
}};`;

await Promise.all([
  fs.writeFile(path.join(out, 'index.html'), html),
  fs.writeFile(path.join(out, 'app.css'), css),
  fs.writeFile(path.join(out, 'app.js'), js),
  fs.writeFile(path.join(out, '_worker.js'), proxy),
  fs.writeFile(path.join(out, '_redirects'), '/* /index.html 200\n'),
  fs.writeFile(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/app.js\n  Cache-Control: public, max-age=300\n\n/app.css\n  Cache-Control: public, max-age=300\n`)
]);

console.log('ASTRA Read static build complete:', out);
