const E = new TextEncoder();
const SEC = {
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=()'
};
const J = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...SEC,...headers}});
const BODY = async r => { try { return await r.json(); } catch { return {}; } };
const safeText = (v,max=5000) => String(v ?? '').trim().slice(0,max);
const validId = v => /^[a-z0-9][a-z0-9-]{1,63}$/.test(v);
const now = () => new Date().toISOString();

async function digest(value){
  const bytes=await crypto.subtle.digest('SHA-256',E.encode(String(value)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function constantEqual(a,b){
  a=String(a||''); b=String(b||'');
  if(a.length!==b.length) return false;
  let x=0; for(let i=0;i<a.length;i++) x|=a.charCodeAt(i)^b.charCodeAt(i);
  return x===0;
}
function cookie(request,name){
  for(const part of (request.headers.get('cookie')||'').split(';')){
    const [key,...rest]=part.trim().split('=');
    if(key===name) return decodeURIComponent(rest.join('='));
  }
  return null;
}
async function user(request,env){
  const token=cookie(request,'ar_session');
  if(!token) return null;
  return env.DB.prepare(`SELECT s.reader_id,a.email,r.display_name,ur.role
    FROM sessions s
    JOIN auth_accounts a ON a.reader_id=s.reader_id
    JOIN reader_profiles r ON r.id=s.reader_id
    LEFT JOIN user_roles ur ON ur.reader_id=s.reader_id
    WHERE s.session_hash=? AND s.expires_at>CURRENT_TIMESTAMP`)
    .bind(await digest(token)).first();
}
function guardWrite(request,url){
  if(!['POST','PUT','PATCH','DELETE'].includes(request.method.toUpperCase())) return null;
  const site=request.headers.get('sec-fetch-site'), origin=request.headers.get('origin');
  if(site==='cross-site'||(origin&&origin!==url.origin)) return J({error:'cross_site_write_blocked'},403);
  return null;
}
async function ownerExists(env){
  const row=await env.DB.prepare("SELECT COUNT(*) n FROM user_roles WHERE role='owner'").first();
  return Number(row?.n||0)>0;
}
async function requireRole(request,env,allowed=['owner','admin']){
  const u=await user(request,env);
  if(!u) return {error:J({error:'unauthorized'},401)};
  if(!allowed.includes(u.role)) return {error:J({error:'forbidden'},403),user:u};
  return {user:u};
}
async function audit(env,actor,action,type,id,before=null,after=null){
  await env.DB.prepare(`INSERT INTO audit_log(actor_reader_id,action,entity_type,entity_id,before_json,after_json)
    VALUES(?,?,?,?,?,?)`).bind(actor?.reader_id||null,action,type,id||null,before?JSON.stringify(before):null,after?JSON.stringify(after):null).run();
}
async function recount(env,bookId){
  const row=await env.DB.prepare('SELECT COUNT(*) n FROM chapters WHERE book_id=?').bind(bookId).first();
  await env.DB.prepare('UPDATE books SET chapter_count=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(Number(row?.n||0),bookId).run();
}

export default {
  async fetch(request,env){
    const url=new URL(request.url), M=request.method.toUpperCase(), p=url.pathname;
    const wg=guardWrite(request,url); if(wg) return wg;

    if(M==='GET'&&p==='/api/admin/health') return J({ok:true,service:'astra-read-admin',version:'1.0.0',payments:false});

    if(M==='GET'&&p==='/api/admin/status'){
      const u=await user(request,env), exists=await ownerExists(env);
      return J({owner_exists:exists,signed_in:Boolean(u),user:u?{email:u.email,display_name:u.display_name,role:u.role||null}:null,bootstrap_available:!exists});
    }

    if(M==='POST'&&p==='/api/admin/bootstrap'){
      const u=await user(request,env); if(!u) return J({error:'unauthorized'},401);
      if(await ownerExists(env)) return J({error:'bootstrap_closed'},409);
      const input=await BODY(request), token=safeText(input.token,200);
      if(!env.ADMIN_BOOTSTRAP_TOKEN||!constantEqual(token,env.ADMIN_BOOTSTRAP_TOKEN)) return J({error:'invalid_bootstrap_token'},403);
      await env.DB.prepare(`INSERT INTO user_roles(reader_id,role) VALUES(?,'owner')
        ON CONFLICT(reader_id) DO UPDATE SET role='owner',updated_at=CURRENT_TIMESTAMP`).bind(u.reader_id).run();
      await audit(env,u,'bootstrap_owner','role',u.reader_id,null,{role:'owner'});
      return J({ok:true,role:'owner'});
    }

    if(M==='GET'&&p==='/api/admin/dashboard'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const [books,chapters,users,openSupport,audits]=await Promise.all([
        env.DB.prepare('SELECT COUNT(*) n FROM books').first(),
        env.DB.prepare('SELECT COUNT(*) n FROM chapters').first(),
        env.DB.prepare('SELECT COUNT(*) n FROM auth_accounts').first(),
        env.DB.prepare("SELECT COUNT(*) n FROM support_requests WHERE status='open'").first(),
        env.DB.prepare('SELECT COUNT(*) n FROM audit_log').first()
      ]);
      return J({role:auth.user.role,stats:{books:Number(books?.n||0),chapters:Number(chapters?.n||0),users:Number(users?.n||0),open_support:Number(openSupport?.n||0),audit_events:Number(audits?.n||0)},payments:false});
    }

    if(M==='GET'&&p==='/api/admin/books'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const rows=await env.DB.prepare('SELECT id,title,author,genre,status,rating,chapter_count,accent,description,created_at,updated_at FROM books ORDER BY updated_at DESC,title').all();
      return J({items:rows.results||[]});
    }

    if(M==='POST'&&p==='/api/admin/books'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const b=await BODY(request), id=safeText(b.id,64).toLowerCase(), title=safeText(b.title,160), author=safeText(b.author,120), genre=safeText(b.genre,80), status=b.status==='Completed'?'Completed':'Ongoing', rating=Math.max(0,Math.min(5,Number(b.rating)||0)), accent=/^#[0-9a-fA-F]{6}$/.test(String(b.accent||''))?String(b.accent):'#5B5BD6', description=safeText(b.description,5000);
      if(!validId(id)||title.length<1||author.length<1||genre.length<1) return J({error:'invalid_book'},400);
      if(await env.DB.prepare('SELECT 1 ok FROM books WHERE id=?').bind(id).first()) return J({error:'book_exists'},409);
      await env.DB.prepare(`INSERT INTO books(id,title,author,genre,status,rating,chapter_count,accent,description) VALUES(?,?,?,?,?,?,0,?,?)`).bind(id,title,author,genre,status,rating,accent,description).run();
      const after={id,title,author,genre,status,rating,accent,description}; await audit(env,auth.user,'create','book',id,null,after);
      return J({ok:true,item:after},201);
    }

    let m=p.match(/^\/api\/admin\/books\/([a-z0-9-]+)$/);
    if(m&&M==='PUT'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const id=m[1], before=await env.DB.prepare('SELECT * FROM books WHERE id=?').bind(id).first(); if(!before) return J({error:'book_not_found'},404);
      const b=await BODY(request), title=safeText(b.title,160)||before.title, author=safeText(b.author,120)||before.author, genre=safeText(b.genre,80)||before.genre, status=b.status==='Completed'?'Completed':b.status==='Ongoing'?'Ongoing':before.status, rating=b.rating===undefined?Number(before.rating):Math.max(0,Math.min(5,Number(b.rating)||0)), accent=/^#[0-9a-fA-F]{6}$/.test(String(b.accent||''))?String(b.accent):before.accent, description=b.description===undefined?before.description:safeText(b.description,5000);
      await env.DB.prepare('UPDATE books SET title=?,author=?,genre=?,status=?,rating=?,accent=?,description=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title,author,genre,status,rating,accent,description,id).run();
      const after={...before,title,author,genre,status,rating,accent,description,updated_at:now()}; await audit(env,auth.user,'update','book',id,before,after);
      return J({ok:true,item:after});
    }

    m=p.match(/^\/api\/admin\/books\/([a-z0-9-]+)\/chapters$/);
    if(m&&M==='GET'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const rows=await env.DB.prepare('SELECT id,book_id,chapter_no,title,is_free,coin_price,published_at,updated_at,LENGTH(body) body_chars FROM chapters WHERE book_id=? ORDER BY chapter_no').bind(m[1]).all();
      return J({items:rows.results||[]});
    }
    if(m&&M==='POST'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const bookId=m[1]; if(!await env.DB.prepare('SELECT 1 ok FROM books WHERE id=?').bind(bookId).first()) return J({error:'book_not_found'},404);
      const b=await BODY(request), chapterNo=Math.max(1,Math.floor(Number(b.chapter_no)||0)), title=safeText(b.title,200), body=safeText(b.body,120000), isFree=b.is_free?1:0, coinPrice=isFree?0:Math.max(1,Math.floor(Number(b.coin_price)||10)), publishedAt=safeText(b.published_at,40)||now();
      if(!chapterNo||title.length<1||body.length<1) return J({error:'invalid_chapter'},400);
      const id=bookId+'-'+chapterNo;
      if(await env.DB.prepare('SELECT 1 ok FROM chapters WHERE book_id=? AND chapter_no=?').bind(bookId,chapterNo).first()) return J({error:'chapter_exists'},409);
      await env.DB.prepare('INSERT INTO chapters(id,book_id,chapter_no,title,body,is_free,coin_price,published_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,bookId,chapterNo,title,body,isFree,coinPrice,publishedAt).run();
      await recount(env,bookId); const after={id,book_id:bookId,chapter_no:chapterNo,title,is_free:isFree,coin_price:coinPrice,published_at:publishedAt}; await audit(env,auth.user,'create','chapter',id,null,after);
      return J({ok:true,item:after},201);
    }

    m=p.match(/^\/api\/admin\/chapters\/([a-z0-9-]+)$/);
    if(m&&M==='GET'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const row=await env.DB.prepare('SELECT * FROM chapters WHERE id=?').bind(m[1]).first(); return row?J({item:row}):J({error:'chapter_not_found'},404);
    }
    if(m&&M==='PUT'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const id=m[1], before=await env.DB.prepare('SELECT * FROM chapters WHERE id=?').bind(id).first(); if(!before) return J({error:'chapter_not_found'},404);
      const b=await BODY(request), title=b.title===undefined?before.title:safeText(b.title,200), body=b.body===undefined?before.body:safeText(b.body,120000), isFree=b.is_free===undefined?Number(before.is_free):(b.is_free?1:0), coinPrice=isFree?0:(b.coin_price===undefined?Number(before.coin_price):Math.max(1,Math.floor(Number(b.coin_price)||10))), publishedAt=b.published_at===undefined?before.published_at:(safeText(b.published_at,40)||before.published_at);
      if(title.length<1||body.length<1) return J({error:'invalid_chapter'},400);
      await env.DB.prepare('UPDATE chapters SET title=?,body=?,is_free=?,coin_price=?,published_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title,body,isFree,coinPrice,publishedAt,id).run();
      const after={...before,title,body,is_free:isFree,coin_price:coinPrice,published_at:publishedAt,updated_at:now()}; await audit(env,auth.user,'update','chapter',id,before,{...after,body:'[content '+body.length+' chars]'});
      return J({ok:true,item:{...after,body}});
    }

    if(M==='GET'&&p==='/api/admin/support'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const status=url.searchParams.get('status');
      const req=status?await env.DB.prepare('SELECT id,reader_id,category,message,contact_email,phone,status,created_at,updated_at FROM support_requests WHERE status=? ORDER BY created_at DESC LIMIT 100').bind(status).all():await env.DB.prepare('SELECT id,reader_id,category,message,contact_email,phone,status,created_at,updated_at FROM support_requests ORDER BY created_at DESC LIMIT 100').all();
      const legacy=await env.DB.prepare('SELECT id,reader_id,subject category,message,NULL contact_email,NULL phone,status,created_at,updated_at FROM support_tickets ORDER BY created_at DESC LIMIT 100').all();
      const items=[...(req.results||[]).map(x=>({...x,source:'request'})),...(legacy.results||[]).map(x=>({...x,source:'ticket'}))].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
      return J({items:items.slice(0,150)});
    }

    m=p.match(/^\/api\/admin\/support\/(request|ticket)\/([^/]+)$/);
    if(m&&M==='PATCH'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const b=await BODY(request), status=b.status==='closed'?'closed':'open', source=m[1], id=decodeURIComponent(m[2]), table=source==='request'?'support_requests':'support_tickets';
      const before=await env.DB.prepare(`SELECT id,status FROM ${table} WHERE id=?`).bind(id).first(); if(!before) return J({error:'support_not_found'},404);
      await env.DB.prepare(`UPDATE ${table} SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,id).run();
      await audit(env,auth.user,'support_status','support',id,before,{...before,status,source}); return J({ok:true,id,status});
    }

    if(M==='GET'&&p==='/api/admin/audit'){
      const auth=await requireRole(request,env); if(auth.error) return auth.error;
      const rows=await env.DB.prepare(`SELECT al.id,al.action,al.entity_type,al.entity_id,al.created_at,r.display_name,a.email
        FROM audit_log al LEFT JOIN reader_profiles r ON r.id=al.actor_reader_id LEFT JOIN auth_accounts a ON a.reader_id=al.actor_reader_id
        ORDER BY al.id DESC LIMIT 200`).all(); return J({items:rows.results||[]});
    }

    if(M==='GET'&&p==='/api/admin/users'){
      const auth=await requireRole(request,env,['owner']); if(auth.error) return auth.error;
      const rows=await env.DB.prepare(`SELECT a.reader_id,a.email,r.display_name,ur.role,r.created_at
        FROM auth_accounts a JOIN reader_profiles r ON r.id=a.reader_id LEFT JOIN user_roles ur ON ur.reader_id=a.reader_id
        ORDER BY r.created_at DESC LIMIT 200`).all(); return J({items:rows.results||[]});
    }

    if(M==='POST'&&p==='/api/admin/roles'){
      const auth=await requireRole(request,env,['owner']); if(auth.error) return auth.error;
      const b=await BODY(request), email=safeText(b.email,254).toLowerCase(), role=b.role==='owner'?'owner':'admin';
      const target=await env.DB.prepare('SELECT reader_id FROM auth_accounts WHERE email=?').bind(email).first(); if(!target) return J({error:'user_not_found'},404);
      await env.DB.prepare(`INSERT INTO user_roles(reader_id,role) VALUES(?,?) ON CONFLICT(reader_id) DO UPDATE SET role=excluded.role,updated_at=CURRENT_TIMESTAMP`).bind(target.reader_id,role).run();
      await audit(env,auth.user,'assign_role','role',target.reader_id,null,{email,role}); return J({ok:true,email,role});
    }

    return J({error:'not_found'},404);
  }
};
