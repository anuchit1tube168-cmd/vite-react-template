const UPSTREAM = 'https://astra-read.anuchit1tube168.workers.dev';

const FALLBACK = `
<style>
  #astra-fallback{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f7f8fc;color:#16181d;min-height:100vh;padding:24px;box-sizing:border-box}
  #astra-fallback .wrap{max-width:980px;margin:0 auto}
  #astra-fallback .brand{font-size:28px;font-weight:800;letter-spacing:-.03em;margin:8px 0 22px}
  #astra-fallback .badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eceffd;font-size:12px;font-weight:700;margin-bottom:14px}
  #astra-fallback h1{font-size:36px;line-height:1.1;margin:0 0 12px}
  #astra-fallback p{line-height:1.65;color:#515866;margin:0 0 18px}
  #astra-fallback .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:20px}
  #astra-fallback .card{background:white;border:1px solid #e7e9ef;border-radius:18px;padding:18px;box-shadow:0 8px 30px rgba(20,26,42,.05)}
  #astra-fallback .card b{display:block;margin-bottom:6px}
  #astra-fallback .status{margin-top:20px;font-size:13px;color:#737b8b}
  @media(max-width:520px){#astra-fallback{padding:18px}#astra-fallback h1{font-size:30px}}
</style>
<div id="astra-fallback">
  <div class="wrap">
    <div class="brand">ASTRA Read</div>
    <div class="badge">Mobile Safe Mode</div>
    <h1>อ่านเรื่องที่ชอบ<br>ในจังหวะของคุณ</h1>
    <p>กำลังโหลดระบบอ่านนิยายจาก Cloudflare หาก JavaScript ของเบราว์เซอร์ถูกจำกัด หน้านี้ยังคงแสดงผลแทนหน้าขาว</p>
    <div class="grid">
      <div class="card"><b>Fantasy</b><span>นครเหนือเมฆ</span></div>
      <div class="card"><b>Mystery</b><span>ตะเกียงสีดำ</span></div>
      <div class="card"><b>Sci‑Fi</b><span>ศูนย์ชั่วโมง</span></div>
      <div class="card"><b>Action</b><span>ชีพจรเหล็ก</span></div>
    </div>
    <div class="status">ASTRA Read · Cloudflare fallback active</div>
  </div>
</div>`;

function injectFallback(html) {
  if (html.includes('<div id="app"></div>')) {
    return html.replace('<div id="app"></div>', `<div id="app">${FALLBACK}</div>`);
  }
  if (html.includes('</body>')) {
    return html.replace('</body>', `${FALLBACK}</body>`);
  }
  return html + FALLBACK;
}

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const upstream = new URL(incoming.pathname + incoming.search, UPSTREAM);
    const headers = new Headers(request.headers);

    headers.set('Origin', UPSTREAM);
    headers.set('Sec-Fetch-Site', 'same-origin');
    headers.set('X-ASTRA-Entry', 'pages.dev');

    const init = {
      method: request.method,
      headers,
      redirect: 'manual'
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;

    try {
      const response = await fetch(new Request(upstream.toString(), init));
      const outHeaders = new Headers(response.headers);
      outHeaders.set('X-ASTRA-Proxy', 'pages-fallback-v2');
      outHeaders.delete('content-length');
      outHeaders.delete('content-encoding');
      outHeaders.delete('transfer-encoding');
      outHeaders.delete('etag');

      const type = (response.headers.get('content-type') || '').toLowerCase();
      const isText = type.includes('text/') || type.includes('javascript') || type.includes('json');

      if (request.method === 'HEAD') {
        return new Response(null, {status: response.status, statusText: response.statusText, headers: outHeaders});
      }

      if (isText) {
        let text = await response.text();
        if (type.includes('text/html')) {
          text = injectFallback(text);
          outHeaders.set('Cache-Control', 'no-store');
        } else if (incoming.pathname === '/app.js' || incoming.pathname === '/app.css') {
          outHeaders.set('Cache-Control', 'no-store');
        }
        return new Response(text, {status: response.status, statusText: response.statusText, headers: outHeaders});
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: outHeaders
      });
    } catch (error) {
      if (request.method === 'GET' && incoming.pathname === '/') {
        return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${FALLBACK}`, {
          status: 200,
          headers: {'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-astra-proxy':'pages-fallback-v2'}
        });
      }
      return new Response(JSON.stringify({
        ok: false,
        error: 'upstream_unavailable',
        message: 'ASTRA Read backend is temporarily unreachable.'
      }), {
        status: 502,
        headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
  }
};
