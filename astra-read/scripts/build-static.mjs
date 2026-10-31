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

const html = unwrap(uiSource, 'html');
const css = unwrap(cssSource, 'css');
const js = unwrap(clientSource, 'client');

const pagesWorker = `const UPSTREAM = 'https://astra-read.anuchit1tube168.workers.dev';
export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    if (!incoming.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const target = new URL(incoming.pathname + incoming.search, UPSTREAM);
    const headers = new Headers(request.headers);
    headers.set('Origin', UPSTREAM);
    headers.set('Sec-Fetch-Site', 'same-origin');
    headers.set('X-ASTRA-Entry', 'cloudflare-pages-static');
    headers.delete('host');
    const init = { method: request.method, headers, redirect: 'manual' };
    if (!['GET','HEAD'].includes(request.method)) init.body = request.body;
    const response = await fetch(target, init);
    const outHeaders = new Headers(response.headers);
    outHeaders.set('X-ASTRA-Proxy', 'pages-static');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outHeaders });
  }
};
`;

await Promise.all([
  fs.writeFile(path.join(out, 'index.html'), html),
  fs.writeFile(path.join(out, 'app.css'), css),
  fs.writeFile(path.join(out, 'app.js'), js),
  fs.writeFile(path.join(out, '_worker.js'), pagesWorker),
  fs.writeFile(path.join(out, '_redirects'), '/* /index.html 200\n'),
  fs.writeFile(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/app.js\n  Cache-Control: public, max-age=300\n\n/app.css\n  Cache-Control: public, max-age=300\n`)
]);

console.log('ASTRA Read static build complete:', out);
