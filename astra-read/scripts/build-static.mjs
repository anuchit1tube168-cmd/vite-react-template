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

const vipParityPatch = `<script>(function(){function mapVip(){document.querySelectorAll('.vipBtn[data-act="vip"]').forEach(function(b){b.dataset.act='wallet';b.title='Coin packages'})}mapVip();new MutationObserver(mapVip).observe(document.documentElement,{childList:true,subtree:true})})();</script>`;
const html = unwrap(uiSource, 'html').replace('</body>', vipParityPatch + '</body>');
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
