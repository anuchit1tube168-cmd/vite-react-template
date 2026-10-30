const UPSTREAM = 'https://astra-read.anuchit1tube168.workers.dev';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const upstream = new URL(incoming.pathname + incoming.search, UPSTREAM);
    const headers = new Headers(request.headers);

    // Make state-changing requests look same-origin to the canonical Worker.
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
      outHeaders.set('X-ASTRA-Proxy', 'pages-fallback');
      outHeaders.set('Cache-Control', response.headers.get('Cache-Control') || 'no-store');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: outHeaders
      });
    } catch (error) {
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
