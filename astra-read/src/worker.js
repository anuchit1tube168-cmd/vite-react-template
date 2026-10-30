import { HTML } from './ui.js';
import { CSS } from './styles.js';
import { CLIENT } from './client.js';

const securityHeaders = {
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=()',
  'x-frame-options':'SAMEORIGIN'
};

const json = (data,status=200,cache='no-store') => new Response(JSON.stringify(data),{
  status,
  headers:{'content-type':'application/json; charset=utf-8','cache-control':cache,...securityHeaders}
});
const text = (body,type,status=200,cache='public, max-age=60') => new Response(body,{status,headers:{'content-type':type,'cache-control':cache,...securityHeaders}});
const validReader = id => typeof id === 'string' && /^[A-Za-z0-9_-]{6,80}$/.test(id);
const validBook = id => typeof id === 'string' && /^[a-z0-9-]{2,64}$/.test(id);
const bodyJson = async req => { try { return await req.json(); } catch { return {}; } };

async function ensureReader(env,id,displayName='Reader') {
  if (!validReader(id)) return false;
  await env.DB.prepare(`INSERT INTO reader_profiles(id,display_name) VALUES(?,?)
    ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name, updated_at=CURRENT_TIMESTAMP`)
    .bind(id,String(displayName||'Reader').slice(0,80)).run();
  return true;
}

async function catalog(env) {
  const {results=[]} = await env.DB.prepare(`SELECT id,title,author,genre,status,rating,
    chapter_count AS chapters,accent,description FROM books ORDER BY rating DESC,title ASC`).all();
  const genres=['All',...new Set(results.map(x=>x.genre))];
  return {items:results,genres};
}

async function api(request,env,url) {
  const method=request.method.toUpperCase();
  const path=url.pathname;

  if (method==='GET' && path==='/api/health') {
    const row=await env.DB.prepare('SELECT COUNT(*) AS books FROM books').first();
    return json({ok:true,service:'astra-read',version:'0.2.0',mode:'d1',books:Number(row?.books||0)});
  }

  if (method==='GET' && path==='/api/catalog') return json(await catalog(env),200,'public, max-age=60');

  if (method==='POST' && path==='/api/readers') {
    const b=await bodyJson(request);
    if (!validReader(b.reader_id)) return json({error:'invalid_reader_id'},400);
    await ensureReader(env,b.reader_id,b.display_name||'Reader');
    return json({ok:true,reader_id:b.reader_id,display_name:String(b.display_name||'Reader').slice(0,80)},201);
  }

  if (method==='GET' && path==='/api/library') {
    const reader=request.headers.get('x-reader-id');
    if (!validReader(reader)) return json({error:'reader_required'},401);
    await ensureReader(env,reader,'Reader');
    const {results=[]}=await env.DB.prepare(`SELECT b.id,b.title,b.author,b.genre,b.status,b.rating,b.chapter_count AS chapters,b.accent,b.description
      FROM library_items l JOIN books b ON b.id=l.book_id WHERE l.reader_id=? ORDER BY l.created_at DESC`).bind(reader).all();
    return json({items:results});
  }

  const libMatch=path.match(/^\/api\/library\/([a-z0-9-]+)$/);
  if (libMatch && ['POST','DELETE'].includes(method)) {
    const reader=request.headers.get('x-reader-id'),bookId=libMatch[1];
    if (!validReader(reader)) return json({error:'reader_required'},401);
    if (!validBook(bookId)) return json({error:'invalid_book'},400);
    await ensureReader(env,reader,'Reader');
    const exists=await env.DB.prepare('SELECT id FROM books WHERE id=?').bind(bookId).first();
    if (!exists) return json({error:'book_not_found'},404);
    if (method==='POST') {
      await env.DB.prepare('INSERT OR IGNORE INTO library_items(reader_id,book_id) VALUES(?,?)').bind(reader,bookId).run();
      return json({ok:true,in_library:true});
    }
    await env.DB.prepare('DELETE FROM library_items WHERE reader_id=? AND book_id=?').bind(reader,bookId).run();
    return json({ok:true,in_library:false});
  }

  if (method==='GET' && path==='/api/progress') {
    const reader=request.headers.get('x-reader-id');
    if (!validReader(reader)) return json({error:'reader_required'},401);
    const {results=[]}=await env.DB.prepare('SELECT book_id,chapter_no,progress_pct,updated_at FROM reading_progress WHERE reader_id=?').bind(reader).all();
    return json({items:results});
  }

  const progMatch=path.match(/^\/api\/progress\/([a-z0-9-]+)$/);
  if (progMatch && method==='PUT') {
    const reader=request.headers.get('x-reader-id'),bookId=progMatch[1],b=await bodyJson(request);
    if (!validReader(reader)) return json({error:'reader_required'},401);
    const chapter=Math.max(1,Math.min(100000,Number(b.chapter_no||1)|0));
    const pct=Math.max(0,Math.min(100,Number(b.progress_pct||0)));
    await ensureReader(env,reader,'Reader');
    const exists=await env.DB.prepare('SELECT id,chapter_count FROM books WHERE id=?').bind(bookId).first();
    if (!exists) return json({error:'book_not_found'},404);
    const safeChapter=Math.min(chapter,Number(exists.chapter_count||chapter));
    await env.DB.prepare(`INSERT INTO reading_progress(reader_id,book_id,chapter_no,progress_pct,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(reader_id,book_id) DO UPDATE SET chapter_no=excluded.chapter_no,progress_pct=excluded.progress_pct,updated_at=CURRENT_TIMESTAMP`)
      .bind(reader,bookId,safeChapter,pct).run();
    return json({ok:true,book_id:bookId,chapter_no:safeChapter,progress_pct:pct});
  }

  const detailMatch=path.match(/^\/api\/books\/([a-z0-9-]+)$/);
  if (detailMatch && method==='GET') {
    const id=detailMatch[1];
    const book=await env.DB.prepare(`SELECT id,title,author,genre,status,rating,chapter_count AS chapters,accent,description FROM books WHERE id=?`).bind(id).first();
    if (!book) return json({error:'book_not_found'},404);
    const {results:chapters=[]}=await env.DB.prepare(`SELECT chapter_no,title,is_free,coin_price,published_at FROM chapters WHERE book_id=? ORDER BY chapter_no`).bind(id).all();
    return json({book,chapters},200,'public, max-age=60');
  }

  const chapterMatch=path.match(/^\/api\/books\/([a-z0-9-]+)\/chapters\/(\d+)$/);
  if (chapterMatch && method==='GET') {
    const [_,bookId,numText]=chapterMatch,chapterNo=Number(numText);
    const ch=await env.DB.prepare(`SELECT c.id,c.book_id,c.chapter_no,c.title,c.body,c.is_free,c.coin_price,b.title AS book_title,b.chapter_count
      FROM chapters c JOIN books b ON b.id=c.book_id WHERE c.book_id=? AND c.chapter_no=?`).bind(bookId,chapterNo).first();
    if (!ch) return json({error:'chapter_not_found'},404);
    let allowed=Number(ch.is_free)===1;
    const reader=request.headers.get('x-reader-id');
    if (!allowed && validReader(reader)) {
      const e=await env.DB.prepare(`SELECT 1 AS ok FROM entitlements WHERE reader_id=? AND chapter_id=? AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP)`).bind(reader,ch.id).first();
      allowed=!!e;
    }
    if (!allowed) return json({locked:true,book_id:bookId,chapter_no:chapterNo,title:ch.title,coin_price:ch.coin_price},402);
    return json({locked:false,book_id:bookId,book_title:ch.book_title,chapter_no:chapterNo,title:ch.title,body:ch.body,coin_price:ch.coin_price,chapter_count:ch.chapter_count});
  }

  const unlockMatch=path.match(/^\/api\/demo\/unlock\/([a-z0-9-]+)\/(\d+)$/);
  if (unlockMatch && method==='POST') {
    const reader=request.headers.get('x-reader-id');
    if (!validReader(reader)) return json({error:'reader_required'},401);
    await ensureReader(env,reader,'Reader');
    const ch=await env.DB.prepare('SELECT id FROM chapters WHERE book_id=? AND chapter_no=?').bind(unlockMatch[1],Number(unlockMatch[2])).first();
    if (!ch) return json({error:'chapter_not_found'},404);
    await env.DB.prepare(`INSERT OR IGNORE INTO entitlements(reader_id,chapter_id,source) VALUES(?,?,'demo-phase2')`).bind(reader,ch.id).run();
    return json({ok:true,demo:true,warning:'No real payment was charged.'});
  }

  return json({error:'not_found'},404);
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return await api(request,env,url);
      if (url.pathname==='/app.css') return text(CSS,'text/css; charset=utf-8');
      if (url.pathname==='/app.js') return text(CLIENT,'text/javascript; charset=utf-8');
      return text(HTML,'text/html; charset=utf-8');
    } catch (error) {
      console.error('ASTRA_READ_ERROR',error);
      return json({error:'internal_error'},500);
    }
  }
};
