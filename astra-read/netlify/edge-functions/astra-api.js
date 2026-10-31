const UPSTREAM = 'https://astra-read.anuchit1tube168.workers.dev';

export default async (request) => {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, UPSTREAM);
  const headers = new Headers(request.headers);

  headers.set('Origin', UPSTREAM);
  headers.set('Sec-Fetch-Site', 'same-origin');
  headers.set('X-ASTRA-Entry', 'netlify');
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual'
  };

  if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;

  const response = await fetch(target, init);
  const out = new Headers(response.headers);
  out.set('X-ASTRA-Proxy', 'netlify-edge');
  out.set('Cache-Control', response.headers.get('Cache-Control') || 'no-store');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: out
  });
};
