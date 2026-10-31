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

const parityPatch = `<script>(function(){
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function mapVip(){document.querySelectorAll('.vipBtn[data-act="vip"]').forEach(function(b){b.dataset.act='wallet';b.title='Coin packages'})}
function openRegister(){var modal=document.querySelector('#modal'),body=document.querySelector('#modalBody');if(!modal||!body)return;body.innerHTML='<div class="authMark">A</div><h2 class="center">Create an Account</h2><p class="muted center">สมัครสมาชิกฟรีเพื่อเริ่มอ่านและบันทึกประวัติ</p><button class="googleBtn" data-google>G&nbsp;&nbsp; Continue with Google</button><div class="or"><span>OR WITH EMAIL</span></div><label class="fieldLabel">Username</label><input id="registerUsername" class="field" placeholder="เช่น astra_reader" required><label class="fieldLabel">Email Address</label><input id="registerEmail" class="field" type="email" placeholder="name@example.com" required><label class="fieldLabel">Password</label><input id="registerPassword" class="field" type="password" placeholder="อย่างน้อย 10 ตัวอักษร" required><button class="btn primary full" style="margin-top:14px" data-register-submit>Create Account</button><p class="center small">มีบัญชีอยู่แล้ว? <button class="textBtn" data-register-back>เข้าสู่ระบบ</button></p><div id="registerResult"></div>';modal.classList.add('show')}
mapVip();new MutationObserver(mapVip).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',async function(e){var reg=e.target.closest('[data-register]');if(reg){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openRegister();return}var back=e.target.closest('[data-register-back]');if(back){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();document.querySelector('#modal')?.classList.remove('show');setTimeout(function(){document.querySelector('[data-act="signin"]')?.click()},0);return}var submit=e.target.closest('[data-register-submit]');if(submit){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();var display_name=document.querySelector('#registerUsername')?.value.trim()||'',email=document.querySelector('#registerEmail')?.value.trim()||'',password=document.querySelector('#registerPassword')?.value||'';submit.disabled=true;submit.textContent='Creating...';try{var r=await fetch('/api/auth/register',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({display_name:display_name,email:email,password:password})});var d=await r.json().catch(function(){return {}});if(!r.ok)throw new Error(d.error||'request_failed');document.querySelector('#registerResult').innerHTML='<div class="demoNotice">สร้างบัญชีสำเร็จ กำลังเข้าสู่ระบบ...</div>';setTimeout(function(){location.reload()},350)}catch(err){var map={invalid_email:'E-mail ไม่ถูกต้อง',password_policy:'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร',invalid_display_name:'Username ต้องมีอย่างน้อย 2 ตัวอักษร',email_in_use:'E-mail นี้ถูกใช้แล้ว',rate_limited:'ลองใหม่ภายหลัง'};document.querySelector('#registerResult').innerHTML='<div class="demoNotice">'+esc(map[err.message]||'สร้างบัญชีไม่สำเร็จ')+'</div>';submit.disabled=false;submit.textContent='Create Account'}return}},true)
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
