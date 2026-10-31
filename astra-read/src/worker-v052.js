import base from './worker-v051.js';

const E = new TextEncoder();
const J = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin'
  }
});

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', E.encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function cookie(request, name) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

async function currentUser(request, env) {
  const token = cookie(request, 'ar_session');
  if (!token) return null;
  return env.DB.prepare(`
    SELECT s.reader_id, a.email, r.display_name
    FROM sessions s
    JOIN auth_accounts a ON a.reader_id=s.reader_id
    JOIN reader_profiles r ON r.id=s.reader_id
    WHERE s.session_hash=? AND s.expires_at>CURRENT_TIMESTAMP
  `).bind(await digest(token)).first();
}

function writeGuard(request, url) {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site' || (origin && origin !== url.origin)) return J({error:'cross_site_write_blocked'},403);
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const response = await base.fetch(request, env, ctx);
      try {
        const data = await response.json();
        return J({...data, version:'0.5.2', mode:'parity-reader-auto-purchase'});
      } catch {
        return response;
      }
    }

    if (url.pathname === '/api/reader/auto-purchase') {
      const user = await currentUser(request, env);
      if (!user) return J({error:'unauthorized'},401);

      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT auto_purchase FROM reader_preferences WHERE reader_id=?').bind(user.reader_id).first();
        return J({auto_purchase:Boolean(Number(row?.auto_purchase || 0))});
      }

      if (request.method === 'PUT') {
        const guard = writeGuard(request, url);
        if (guard) return guard;
        let input = {};
        try { input = await request.json(); } catch {}
        const value = input.auto_purchase ? 1 : 0;
        await env.DB.prepare(`INSERT INTO reader_preferences(reader_id,auto_purchase,updated_at)
          VALUES(?,?,CURRENT_TIMESTAMP)
          ON CONFLICT(reader_id) DO UPDATE SET auto_purchase=excluded.auto_purchase,updated_at=CURRENT_TIMESTAMP`)
          .bind(user.reader_id, value).run();
        return J({ok:true,auto_purchase:Boolean(value)});
      }

      return J({error:'method_not_allowed'},405);
    }

    return base.fetch(request, env, ctx);
  }
};
