import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'src');
const out = path.join(root, 'dist');

await fs.mkdir(path.join(out, 'admin'), { recursive: true });
const [adminHtml, adminSource] = await Promise.all([
  fs.readFile(path.join(src, 'admin-page.html'), 'utf8'),
  fs.readFile(path.join(src, 'admin-worker-v2.js'), 'utf8')
]);

const transformed = adminSource.replace('export default{', 'const adminWorker={').replace('export default {', 'const adminWorker = {');
if (transformed === adminSource) throw new Error('admin worker export transform failed');
const embeddedAdmin = JSON.stringify(adminHtml);

const proxy = `${transformed}

const CORE='https://astra-read.anuchit1tube168.workers.dev';
const ADMIN_HTML=${embeddedAdmin};
async function proxyCore(request){
  const u=new URL(request.url);
  const target=new URL(u.pathname+u.search,CORE);
  const h=new Headers(request.headers);
  h.set('Origin',CORE);
  h.set('Sec-Fetch-Site','same-origin');
  h.set('X-ASTRA-Entry','pages-admin-v06');
  const init={method:request.method,headers:h,redirect:'manual'};
  if(!['GET','HEAD'].includes(request.method)) init.body=request.body;
  const r=await fetch(new Request(target,init));
  const oh=new Headers(r.headers);
  oh.set('X-ASTRA-Proxy','pages-core-api');
  oh.set('Cache-Control','no-store');
  return new Response(r.body,{status:r.status,statusText:r.statusText,headers:oh});
}

export default {async fetch(request,env,ctx){
  const u=new URL(request.url);
  if(u.pathname==='/admin'||u.pathname==='/admin/'){
    return new Response(ADMIN_HTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'}});
  }
  if(u.pathname.startsWith('/api/admin/')) return adminWorker.fetch(request,env,ctx);
  if(u.pathname.startsWith('/api/')) return proxyCore(request);
  return env.ASSETS.fetch(request);
}};`;

await Promise.all([
  fs.writeFile(path.join(out, 'admin', 'index.html'), adminHtml),
  fs.writeFile(path.join(out, '_worker.js'), proxy)
]);
console.log('ASTRA Read admin console wired into Pages build');
