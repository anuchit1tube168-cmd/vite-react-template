import base from './worker-v05.js';

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

async function limited(env, request, scope, limit = 5, seconds = 3600) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = (await digest(scope + '|' + ip)).slice(0, 32);
  const now = Date.now();
  const row = await env.DB.prepare('SELECT count,reset_at FROM rate_limits WHERE key_hash=?').bind(key).first();
  if (!row || Date.parse(row.reset_at) <= now) {
    const reset = new Date(now + seconds * 1000).toISOString();
    await env.DB.prepare(`INSERT INTO rate_limits(key_hash,scope,count,reset_at,updated_at)
      VALUES(?,?,1,?,CURRENT_TIMESTAMP)
      ON CONFLICT(key_hash) DO UPDATE SET scope=excluded.scope,count=1,reset_at=excluded.reset_at,updated_at=CURRENT_TIMESTAMP`)
      .bind(key, scope, reset).run();
    return false;
  }
  if (Number(row.count) >= limit) return true;
  await env.DB.prepare('UPDATE rate_limits SET count=count+1,updated_at=CURRENT_TIMESTAMP WHERE key_hash=?').bind(key).run();
  return false;
}

async function jsonBody(request) {
  try { return await request.json(); } catch { return {}; }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const response = await base.fetch(request, env, ctx);
      try {
        const data = await response.json();
        return J({...data, version:'0.5.1', mode:'parity-guest-support'});
      } catch {
        return response;
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/support/public') {
      const guard = writeGuard(request, url);
      if (guard) return guard;
      if (await limited(env, request, 'public-support', 5, 3600)) return J({error:'rate_limited'},429);

      const input = await jsonBody(request);
      const category = String(input.category || '').trim().slice(0, 80);
      const message = String(input.message || '').trim().slice(0, 3000);
      const contactEmail = String(input.contact_email || '').trim().toLowerCase().slice(0, 254);
      const phone = String(input.phone || '').trim().slice(0, 40);
      const allowed = ['coin_issue','rights_report','content_issue','typo_report','other'];

      if (!allowed.includes(category)) return J({error:'invalid_category'},400);
      if (message.length < 10) return J({error:'invalid_message'},400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return J({error:'invalid_email'},400);

      const user = await currentUser(request, env);
      const id = 'S-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      await env.DB.prepare(`INSERT INTO support_requests(id,reader_id,category,message,contact_email,phone)
        VALUES(?,?,?,?,?,?)`)
        .bind(id, user?.reader_id || null, category, message, contactEmail, phone || null).run();

      if (user) {
        await env.DB.prepare(`INSERT INTO notifications(reader_id,kind,title,body) VALUES(?,?,?,?)`)
          .bind(user.reader_id, 'support', 'รับเรื่องแล้ว: ' + id, category).run();
      }
      return J({ok:true,id,status:'open'},201);
    }

    if (request.method === 'GET' && url.pathname === '/api/support/requests') {
      const user = await currentUser(request, env);
      if (!user) return J({error:'unauthorized'},401);
      const rows = await env.DB.prepare(`SELECT id,category,message,contact_email,phone,status,created_at,updated_at
        FROM support_requests WHERE reader_id=? ORDER BY created_at DESC LIMIT 30`)
        .bind(user.reader_id).all();
      return J({items:rows.results || []});
    }

    return base.fetch(request, env, ctx);
  }
};
