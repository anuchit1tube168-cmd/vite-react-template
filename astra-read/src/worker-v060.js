import base from './worker-v052.js';

const E = new TextEncoder();
const J = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    ...headers
  }
});
const H = (html, status = 200) => new Response(html, {
  status,
  headers: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'SAMEORIGIN',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()'
  }
});

const b64 = a => btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const un64 = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((s.length+3)%4)), c => c.charCodeAt(0));
const rnd = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', E.encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function ph(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', E.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:un64(salt),iterations}, key, 256)));
}
function eq(a,b){ if(!a || !b || a.length!==b.length) return false; let x=0; for(let i=0;i<a.length;i++) x|=a.charCodeAt(i)^b.charCodeAt(i); return x===0; }
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
async function roleFor(env, readerId) {
  const row = await env.DB.prepare('SELECT role FROM user_roles WHERE reader_id=?').bind(readerId).first();
  return row?.role || null;
}
async function adminContext(request, env) {
  const user = await currentUser(request, env);
  if (!user) return {response:J({error:'unauthorized'},401)};
  const role = await roleFor(env, user.reader_id);
  if (!role) return {response:J({error:'forbidden'},403)};
  return {user, role};
}
function writeGuard(request, url) {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site' || (origin && origin !== url.origin)) return J({error:'cross_site_write_blocked'},403);
  return null;
}
async function body(request){ try{return await request.json();}catch{return {};} }
async function audit(env, actor, action, entityType, entityId, before, after) {
  await env.DB.prepare('INSERT INTO audit_log(actor_reader_id,action,entity_type,entity_id,before_json,after_json) VALUES(?,?,?,?,?,?)')
    .bind(actor || null, action, entityType, entityId || null, before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after)).run();
}
function cleanText(v, max=5000){ return String(v ?? '').trim().slice(0,max); }
function validBookId(v){ return /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(String(v||'')); }

const ADMIN_HTML = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASTRA Read Admin</title><style>
:root{font-family:Inter,system-ui,-apple-system,sans-serif;color:#1d2433;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}button,input,select,textarea{font:inherit}.top{position:sticky;top:0;z-index:3;background:#111827;color:white;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}.brand{font-weight:900;letter-spacing:.04em}.brand span{color:#f6c85f}.wrap{max-width:1280px;margin:auto;padding:18px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:16px;box-shadow:0 8px 24px rgba(15,23,42,.04)}.stat b{display:block;font-size:28px;margin-top:4px}.muted{color:#64748b}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.tabs button,.btn{border:1px solid #cbd5e1;background:white;border-radius:12px;padding:9px 12px;cursor:pointer}.tabs button.on,.btn.primary{background:#111827;color:white;border-color:#111827}.btn.danger{background:#fff1f2;color:#be123c;border-color:#fecdd3}.section{display:none}.section.on{display:block}.two{display:grid;grid-template-columns:1fr 1.3fr;gap:14px}.field{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 11px;background:white}.row{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:10px 0}.row3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0}textarea.field{min-height:140px;resize:vertical}.list{display:grid;gap:8px;max-height:620px;overflow:auto}.item{border:1px solid #e2e8f0;border-radius:12px;padding:11px;background:#fff;cursor:pointer}.item:hover{border-color:#94a3b8}.item strong{display:block}.item small{color:#64748b}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.pill{display:inline-block;border-radius:999px;padding:3px 8px;font-size:11px;background:#f1f5f9}.pill.open{background:#fff7ed;color:#c2410c}.pill.closed{background:#ecfdf5;color:#047857}.table{width:100%;border-collapse:collapse}.table th,.table td{border-bottom:1px solid #e2e8f0;padding:9px;text-align:left;vertical-align:top;font-size:13px}.notice{padding:12px;border-radius:12px;background:#eff6ff;color:#1d4ed8;margin:10px 0}.error{background:#fff1f2;color:#be123c}.ok{background:#ecfdf5;color:#047857}.loginGate{max-width:520px;margin:70px auto;text-align:center}.hidden{display:none}@media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}.row,.row3{grid-template-columns:1fr}}@media(max-width:520px){.grid{grid-template-columns:1fr}.wrap{padding:12px}.top{padding:12px}}
</style></head><body><header class="top"><div class="brand"><span>ASTRA</span> Read · Admin</div><div id="who">กำลังตรวจสิทธิ์…</div></header><main class="wrap"><div id="gate" class="loginGate card"><h2>กำลังตรวจสิทธิ์</h2><p class="muted">กรุณาเข้าสู่ระบบด้วยบัญชี Owner/Admin</p><a class="btn primary" href="/">กลับหน้า Sign In</a></div><div id="app" class="hidden"><div id="flash"></div><section class="grid" id="stats"></section><nav class="tabs"><button class="on" data-tab="books">นิยาย/ตอน</button><button data-tab="support">Support</button><button data-tab="users">ผู้ใช้/สิทธิ์</button><button data-tab="audit">Audit Log</button><button data-tab="security">บัญชี Owner</button></nav>
<section id="books" class="section on"><div class="two"><div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Books</h3><button class="btn" id="newBook">＋ New</button></div><div id="bookList" class="list"></div></div><div><div class="card"><h3>Book Editor</h3><div class="row"><input id="bookId" class="field" placeholder="book-id"><input id="bookTitle" class="field" placeholder="ชื่อเรื่อง"></div><div class="row"><input id="bookAuthor" class="field" placeholder="ผู้เขียน"><input id="bookGenre" class="field" placeholder="Genre"></div><div class="row3"><select id="bookStatus" class="field"><option>Ongoing</option><option>Completed</option></select><input id="bookRating" class="field" type="number" min="0" max="5" step="0.1" placeholder="Rating"><input id="bookChapters" class="field" type="number" min="0" placeholder="Chapter count"></div><input id="bookAccent" class="field" placeholder="#5B5BD6"><textarea id="bookDescription" class="field" placeholder="คำโปรย"></textarea><div class="actions"><button class="btn primary" id="saveBook">Save Book</button><button class="btn" id="loadChapters">Load Chapters</button></div></div><div class="card" style="margin-top:14px"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Chapters</h3><button class="btn" id="newChapter">＋ New</button></div><div class="two"><div id="chapterList" class="list"></div><div><input id="chapterId" type="hidden"><div class="row"><input id="chapterNo" class="field" type="number" min="1" placeholder="ตอนที่"><input id="chapterTitle" class="field" placeholder="ชื่อตอน"></div><div class="row"><select id="chapterFree" class="field"><option value="1">Free</option><option value="0">Locked</option></select><input id="chapterPrice" class="field" type="number" min="0" placeholder="Coin price"></div><textarea id="chapterBody" class="field" style="min-height:280px" placeholder="เนื้อหาตอน"></textarea><div class="actions"><button class="btn primary" id="saveChapter">Save Chapter</button><button class="btn danger" id="deleteChapter">Delete Chapter</button></div></div></div></div></div></div></section>
<section id="support" class="section"><div class="card"><h3>Support Queue</h3><div id="supportList" class="list"></div></div></section>
<section id="users" class="section"><div class="card"><h3>Users & Roles</h3><table class="table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody id="userRows"></tbody></table></div></section>
<section id="audit" class="section"><div class="card"><h3>Audit Log</h3><table class="table"><thead><tr><th>เวลา</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead><tbody id="auditRows"></tbody></table></div></section>
<section id="security" class="section"><div class="card" style="max-width:720px"><h3>Owner Account</h3><p class="muted">เปลี่ยนชื่อแสดงผล อีเมล หรือรหัสผ่าน โดยต้องยืนยันรหัสผ่านปัจจุบัน</p><input id="secName" class="field" placeholder="Display name"><input id="secEmail" class="field" type="email" placeholder="Email" style="margin-top:10px"><input id="secCurrent" class="field" type="password" placeholder="Current password" style="margin-top:10px"><input id="secNew" class="field" type="password" placeholder="New password (เว้นว่างถ้าไม่เปลี่ยน)" style="margin-top:10px"><button class="btn primary" id="saveSecurity" style="margin-top:10px">Update Account</button></div></section>
</div></main><script>
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let ctx=null,books=[],currentBook=null,currentChapter=null;
async function api(path,opt={}){const r=await fetch(path,{credentials:'same-origin',headers:{'content-type':'application/json',...(opt.headers||{})},...opt});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Object.assign(new Error(d.error||'request_failed'),{status:r.status,data:d});return d}
function flash(msg,kind='ok'){$('#flash').innerHTML='<div class="notice '+kind+'">'+esc(msg)+'</div>';setTimeout(()=>$('#flash').innerHTML='',3500)}
async function boot(){try{ctx=await api('/api/admin/me');$('#who').textContent=ctx.user.display_name+' · '+ctx.role;$('#gate').classList.add('hidden');$('#app').classList.remove('hidden');$('#secName').value=ctx.user.display_name;$('#secEmail').value=ctx.user.email;await Promise.all([loadStats(),loadBooks(),loadSupport(),loadUsers(),loadAudit()])}catch(e){$('#who').textContent=e.status===401?'ยังไม่เข้าสู่ระบบ':'ไม่มีสิทธิ์ Admin';$('#gate h2').textContent=e.status===401?'กรุณา Sign In':'Access denied';}}
async function loadStats(){const d=await api('/api/admin/stats');$('#stats').innerHTML=[['Books',d.books],['Chapters',d.chapters],['Users',d.users],['Open Support',d.open_support]].map(x=>'<div class="card stat"><span class="muted">'+x[0]+'</span><b>'+x[1]+'</b></div>').join('')}
async function loadBooks(){const d=await api('/api/admin/books');books=d.items||[];$('#bookList').innerHTML=books.map(b=>'<div class="item" data-book="'+esc(b.id)+'"><strong>'+esc(b.title)+'</strong><small>'+esc(b.author)+' · '+esc(b.genre)+' · '+b.chapter_count+' Chs</small></div>').join('')||'<div class="muted">ยังไม่มีนิยาย</div>'}
function fillBook(b){currentBook=b;$('#bookId').value=b?.id||'';$('#bookId').disabled=!!b;$('#bookTitle').value=b?.title||'';$('#bookAuthor').value=b?.author||'';$('#bookGenre').value=b?.genre||'';$('#bookStatus').value=b?.status||'Ongoing';$('#bookRating').value=b?.rating??4.5;$('#bookChapters').value=b?.chapter_count??0;$('#bookAccent').value=b?.accent||'#5B5BD6';$('#bookDescription').value=b?.description||'';$('#chapterList').innerHTML='';fillChapter(null)}
function bookPayload(){return{id:$('#bookId').value.trim(),title:$('#bookTitle').value.trim(),author:$('#bookAuthor').value.trim(),genre:$('#bookGenre').value.trim(),status:$('#bookStatus').value,rating:Number($('#bookRating').value||0),chapter_count:Number($('#bookChapters').value||0),accent:$('#bookAccent').value.trim(),description:$('#bookDescription').value.trim()}}
async function saveBook(){const p=bookPayload();try{if(currentBook){await api('/api/admin/books/'+encodeURIComponent(currentBook.id),{method:'PUT',body:JSON.stringify(p)})}else{await api('/api/admin/books',{method:'POST',body:JSON.stringify(p)})}flash('บันทึกนิยายแล้ว');await loadBooks();const b=books.find(x=>x.id===p.id);fillBook(b||p);await loadStats()}catch(e){flash(e.data?.detail||e.message,'error')}}
async function loadChapters(){if(!currentBook)return flash('เลือกนิยายก่อน','error');const d=await api('/api/admin/books/'+encodeURIComponent(currentBook.id)+'/chapters');$('#chapterList').innerHTML=(d.items||[]).map(c=>'<div class="item" data-chapter="'+esc(c.id)+'"><strong>'+c.chapter_no+'. '+esc(c.title)+'</strong><small>'+(c.is_free?'Free':c.coin_price+' Coins')+'</small></div>').join('')||'<div class="muted">ยังไม่มีตอน</div>';$('#chapterList')._items=d.items||[]}
function fillChapter(c){currentChapter=c;$('#chapterId').value=c?.id||'';$('#chapterNo').value=c?.chapter_no||'';$('#chapterTitle').value=c?.title||'';$('#chapterFree').value=String(c?.is_free??1);$('#chapterPrice').value=c?.coin_price??0;$('#chapterBody').value=c?.body||''}
function chapterPayload(){return{chapter_no:Number($('#chapterNo').value),title:$('#chapterTitle').value.trim(),body:$('#chapterBody').value,is_free:Number($('#chapterFree').value),coin_price:Number($('#chapterPrice').value||0)}}
async function saveChapter(){if(!currentBook)return flash('เลือกนิยายก่อน','error');const p=chapterPayload();try{if(currentChapter){await api('/api/admin/chapters/'+encodeURIComponent(currentChapter.id),{method:'PUT',body:JSON.stringify(p)})}else{await api('/api/admin/books/'+encodeURIComponent(currentBook.id)+'/chapters',{method:'POST',body:JSON.stringify(p)})}flash('บันทึกตอนแล้ว');await loadChapters();await loadStats()}catch(e){flash(e.data?.detail||e.message,'error')}}
async function deleteChapter(){if(!currentChapter)return flash('เลือกตอนก่อน','error');if(!confirm('ลบตอนนี้?'))return;try{await api('/api/admin/chapters/'+encodeURIComponent(currentChapter.id),{method:'DELETE'});flash('ลบตอนแล้ว');fillChapter(null);await loadChapters();await loadStats()}catch(e){flash(e.message,'error')}}
async function loadSupport(){const d=await api('/api/admin/support');$('#supportList').innerHTML=(d.items||[]).map(s=>'<div class="item"><strong>'+esc(s.category||s.subject||'Support')+' <span class="pill '+s.status+'">'+esc(s.status)+'</span></strong><small>'+esc(s.contact_email||s.email||'')+' · '+esc(s.created_at)+'</small><p>'+esc(s.message)+'</p><div class="actions"><button class="btn" data-support-source="'+s.source+'" data-support-id="'+esc(s.id)+'" data-status="'+(s.status==='open'?'closed':'open')+'">'+(s.status==='open'?'Close':'Reopen')+'</button></div></div>').join('')||'<div class="muted">ไม่มีรายการ</div>'}
async function loadUsers(){const d=await api('/api/admin/users');$('#userRows').innerHTML=(d.items||[]).map(u=>'<tr><td>'+esc(u.display_name)+'</td><td>'+esc(u.email)+'</td><td><select class="field" data-role-user="'+u.reader_id+'"><option value="">reader</option><option value="admin" '+(u.role==='admin'?'selected':'')+'>admin</option><option value="owner" '+(u.role==='owner'?'selected':'')+'>owner</option></select></td><td><button class="btn" data-save-role="'+u.reader_id+'">Save</button></td></tr>').join('')}
async function loadAudit(){const d=await api('/api/admin/audit');$('#auditRows').innerHTML=(d.items||[]).map(a=>'<tr><td>'+esc(a.created_at)+'</td><td>'+esc(a.actor_email||a.actor_reader_id||'system')+'</td><td>'+esc(a.action)+'</td><td>'+esc(a.entity_type)+' · '+esc(a.entity_id||'')+'</td></tr>').join('')}
async function saveSecurity(){try{const d=await api('/api/account/security',{method:'PUT',body:JSON.stringify({current_password:$('#secCurrent').value,new_password:$('#secNew').value,new_email:$('#secEmail').value.trim(),display_name:$('#secName').value.trim()})});flash('อัปเดตบัญชีแล้ว');$('#secCurrent').value='';$('#secNew').value='';ctx.user=d.user;$('#who').textContent=ctx.user.display_name+' · '+ctx.role}catch(e){flash(e.data?.detail||e.message,'error')}}
document.addEventListener('click',async e=>{const tab=e.target.closest('[data-tab]');if(tab){document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x===tab));document.querySelectorAll('.section').forEach(x=>x.classList.toggle('on',x.id===tab.dataset.tab));return}const b=e.target.closest('[data-book]');if(b){fillBook(books.find(x=>x.id===b.dataset.book));return}const c=e.target.closest('[data-chapter]');if(c){fillChapter(($('#chapterList')._items||[]).find(x=>x.id===c.dataset.chapter));return}const s=e.target.closest('[data-support-id]');if(s){try{await api('/api/admin/support/'+s.dataset.supportSource+'/'+encodeURIComponent(s.dataset.supportId),{method:'PUT',body:JSON.stringify({status:s.dataset.status})});await loadSupport();await loadStats();flash('อัปเดต Support แล้ว')}catch(err){flash(err.message,'error')}return}const r=e.target.closest('[data-save-role]');if(r){const sel=document.querySelector('[data-role-user="'+r.dataset.saveRole+'"]');try{await api('/api/admin/users/'+r.dataset.saveRole+'/role',{method:'PUT',body:JSON.stringify({role:sel.value||null})});await loadUsers();flash('อัปเดต Role แล้ว')}catch(err){flash(err.message,'error')}return}});
$('#newBook').onclick=()=>fillBook(null);$('#saveBook').onclick=saveBook;$('#loadChapters').onclick=loadChapters;$('#newChapter').onclick=()=>fillChapter(null);$('#saveChapter').onclick=saveChapter;$('#deleteChapter').onclick=deleteChapter;$('#saveSecurity').onclick=saveSecurity;boot();
</script></body></html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const M = request.method.toUpperCase();

    if (M === 'GET' && url.pathname === '/api/health') {
      const response = await base.fetch(request, env, ctx);
      try {
        const data = await response.json();
        return J({...data, version:'0.6.0', mode:'admin-cms-production-safe'});
      } catch { return response; }
    }

    if (M === 'GET' && url.pathname === '/admin') return H(ADMIN_HTML);

    if (url.pathname === '/api/account/security' && M === 'PUT') {
      const guard = writeGuard(request, url); if (guard) return guard;
      const user = await currentUser(request, env); if (!user) return J({error:'unauthorized'},401);
      const input = await body(request);
      const current = String(input.current_password || '');
      const row = await env.DB.prepare('SELECT password_salt,password_hash,password_iterations,email FROM auth_accounts WHERE reader_id=?').bind(user.reader_id).first();
      if (!row || !eq(await ph(current,row.password_salt,Number(row.password_iterations)),row.password_hash)) return J({error:'invalid_credentials',detail:'รหัสผ่านปัจจุบันไม่ถูกต้อง'},401);
      const displayName = cleanText(input.display_name || user.display_name,80);
      const newEmail = cleanText(input.new_email || user.email,254).toLowerCase();
      if (displayName.length < 2) return J({error:'invalid_display_name',detail:'ชื่อแสดงผลสั้นเกินไป'},400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return J({error:'invalid_email',detail:'รูปแบบอีเมลไม่ถูกต้อง'},400);
      const conflict = await env.DB.prepare('SELECT reader_id FROM auth_accounts WHERE email=? AND reader_id<>?').bind(newEmail,user.reader_id).first();
      if (conflict) return J({error:'email_in_use',detail:'อีเมลนี้ถูกใช้งานแล้ว'},409);
      const before = {email:user.email,display_name:user.display_name};
      await env.DB.batch([
        env.DB.prepare('UPDATE reader_profiles SET display_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(displayName,user.reader_id),
        env.DB.prepare('UPDATE auth_accounts SET email=?,updated_at=CURRENT_TIMESTAMP WHERE reader_id=?').bind(newEmail,user.reader_id)
      ]);
      const np = String(input.new_password || '');
      if (np) {
        if (np.length < 10 || np.length > 128) return J({error:'password_policy',detail:'รหัสผ่านใหม่ต้องยาวอย่างน้อย 10 ตัวอักษร'},400);
        const salt=b64(rnd(16)), iterations=100000, hash=await ph(np,salt,iterations);
        await env.DB.prepare('UPDATE auth_accounts SET password_salt=?,password_hash=?,password_iterations=?,updated_at=CURRENT_TIMESTAMP WHERE reader_id=?').bind(salt,hash,iterations,user.reader_id).run();
      }
      await audit(env,user.reader_id,'account_security_update','reader',user.reader_id,before,{email:newEmail,display_name:displayName,password_changed:Boolean(np)});
      return J({ok:true,user:{id:user.reader_id,email:newEmail,display_name:displayName}});
    }

    if (!url.pathname.startsWith('/api/admin/')) return base.fetch(request, env, ctx);
    const admin = await adminContext(request, env); if (admin.response) return admin.response;
    const guard = M==='GET' ? null : writeGuard(request,url); if (guard) return guard;
    const {user,role} = admin;

    if (M==='GET' && url.pathname==='/api/admin/me') return J({user:{id:user.reader_id,email:user.email,display_name:user.display_name},role});

    if (M==='GET' && url.pathname==='/api/admin/stats') {
      const [books,chapters,users,s1,s2] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) n FROM books').first(), env.DB.prepare('SELECT COUNT(*) n FROM chapters').first(), env.DB.prepare('SELECT COUNT(*) n FROM auth_accounts').first(), env.DB.prepare("SELECT COUNT(*) n FROM support_requests WHERE status='open'").first(), env.DB.prepare("SELECT COUNT(*) n FROM support_tickets WHERE status='open'").first()
      ]);
      return J({books:Number(books?.n||0),chapters:Number(chapters?.n||0),users:Number(users?.n||0),open_support:Number(s1?.n||0)+Number(s2?.n||0)});
    }

    if (M==='GET' && url.pathname==='/api/admin/books') {
      const q=await env.DB.prepare('SELECT id,title,author,genre,status,rating,chapter_count,accent,description,created_at,updated_at FROM books ORDER BY updated_at DESC,title').all();
      return J({items:q.results||[]});
    }
    if (M==='POST' && url.pathname==='/api/admin/books') {
      const x=await body(request), id=cleanText(x.id,64), title=cleanText(x.title,180), author=cleanText(x.author,120), genre=cleanText(x.genre,60), status=x.status==='Completed'?'Completed':'Ongoing', rating=Math.max(0,Math.min(5,Number(x.rating||0))), chapterCount=Math.max(0,Math.floor(Number(x.chapter_count||0))), accent=cleanText(x.accent||'#5B5BD6',16), description=cleanText(x.description,5000);
      if(!validBookId(id)||title.length<1||author.length<1||genre.length<1) return J({error:'invalid_book',detail:'ตรวจ Book ID / ชื่อ / ผู้เขียน / Genre'},400);
      if(await env.DB.prepare('SELECT 1 ok FROM books WHERE id=?').bind(id).first()) return J({error:'book_exists',detail:'Book ID นี้มีแล้ว'},409);
      await env.DB.prepare('INSERT INTO books(id,title,author,genre,status,rating,chapter_count,accent,description) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,title,author,genre,status,rating,chapterCount,accent,description).run();
      const after={id,title,author,genre,status,rating,chapter_count:chapterCount,accent,description}; await audit(env,user.reader_id,'book_create','book',id,null,after); return J({ok:true,item:after},201);
    }
    let m=url.pathname.match(/^\/api\/admin\/books\/([a-z0-9-]+)$/);
    if(m && M==='PUT') {
      const id=m[1], before=await env.DB.prepare('SELECT * FROM books WHERE id=?').bind(id).first(); if(!before)return J({error:'book_not_found'},404);
      const x=await body(request), title=cleanText(x.title||before.title,180), author=cleanText(x.author||before.author,120), genre=cleanText(x.genre||before.genre,60), status=x.status==='Completed'?'Completed':'Ongoing', rating=Math.max(0,Math.min(5,Number(x.rating??before.rating))), chapterCount=Math.max(0,Math.floor(Number(x.chapter_count??before.chapter_count))), accent=cleanText(x.accent||before.accent,16), description=cleanText(x.description??before.description,5000);
      await env.DB.prepare('UPDATE books SET title=?,author=?,genre=?,status=?,rating=?,chapter_count=?,accent=?,description=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title,author,genre,status,rating,chapterCount,accent,description,id).run();
      const after={...before,title,author,genre,status,rating,chapter_count:chapterCount,accent,description}; await audit(env,user.reader_id,'book_update','book',id,before,after); return J({ok:true,item:after});
    }
    m=url.pathname.match(/^\/api\/admin\/books\/([a-z0-9-]+)\/chapters$/);
    if(m && M==='GET') {
      const q=await env.DB.prepare('SELECT id,book_id,chapter_no,title,body,is_free,coin_price,published_at,created_at,updated_at FROM chapters WHERE book_id=? ORDER BY chapter_no').bind(m[1]).all(); return J({items:q.results||[]});
    }
    if(m && M==='POST') {
      const bookId=m[1]; if(!await env.DB.prepare('SELECT 1 ok FROM books WHERE id=?').bind(bookId).first())return J({error:'book_not_found'},404);
      const x=await body(request), no=Math.floor(Number(x.chapter_no)), title=cleanText(x.title,180), text=String(x.body||'').slice(0,200000), free=Number(x.is_free)?1:0, price=free?0:Math.max(0,Math.floor(Number(x.coin_price||0)));
      if(!Number.isInteger(no)||no<1||!title||!text.trim())return J({error:'invalid_chapter',detail:'ต้องมีเลขตอน ชื่อตอน และเนื้อหา'},400);
      if(await env.DB.prepare('SELECT 1 ok FROM chapters WHERE book_id=? AND chapter_no=?').bind(bookId,no).first())return J({error:'chapter_exists',detail:'เลขตอนนี้มีแล้ว'},409);
      const id=bookId+'-'+no+'-'+crypto.randomUUID().slice(0,8); await env.DB.prepare('INSERT INTO chapters(id,book_id,chapter_no,title,body,is_free,coin_price) VALUES(?,?,?,?,?,?,?)').bind(id,bookId,no,title,text,free,price).run();
      await env.DB.prepare('UPDATE books SET chapter_count=MAX(chapter_count,?),updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(no,bookId).run();
      const after={id,book_id:bookId,chapter_no:no,title,is_free:free,coin_price:price}; await audit(env,user.reader_id,'chapter_create','chapter',id,null,after); return J({ok:true,item:after},201);
    }
    m=url.pathname.match(/^\/api\/admin\/chapters\/([^/]+)$/);
    if(m && M==='PUT') {
      const id=decodeURIComponent(m[1]), before=await env.DB.prepare('SELECT * FROM chapters WHERE id=?').bind(id).first(); if(!before)return J({error:'chapter_not_found'},404);
      const x=await body(request), no=Math.floor(Number(x.chapter_no??before.chapter_no)), title=cleanText(x.title??before.title,180), text=String(x.body??before.body).slice(0,200000), free=Number(x.is_free??before.is_free)?1:0, price=free?0:Math.max(0,Math.floor(Number(x.coin_price??before.coin_price)));
      if(!Number.isInteger(no)||no<1||!title||!text.trim())return J({error:'invalid_chapter'},400);
      const duplicate=await env.DB.prepare('SELECT id FROM chapters WHERE book_id=? AND chapter_no=? AND id<>?').bind(before.book_id,no,id).first(); if(duplicate)return J({error:'chapter_exists'},409);
      await env.DB.prepare('UPDATE chapters SET chapter_no=?,title=?,body=?,is_free=?,coin_price=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(no,title,text,free,price,id).run();
      const after={...before,chapter_no:no,title,body:text,is_free:free,coin_price:price}; await audit(env,user.reader_id,'chapter_update','chapter',id,before,after); return J({ok:true,item:after});
    }
    if(m && M==='DELETE') {
      const id=decodeURIComponent(m[1]), before=await env.DB.prepare('SELECT * FROM chapters WHERE id=?').bind(id).first(); if(!before)return J({error:'chapter_not_found'},404);
      await env.DB.prepare('DELETE FROM chapters WHERE id=?').bind(id).run(); await audit(env,user.reader_id,'chapter_delete','chapter',id,before,null); return J({ok:true,deleted:true});
    }

    if(M==='GET' && url.pathname==='/api/admin/support') {
      const [g,a]=await Promise.all([
        env.DB.prepare("SELECT id,'guest' source,reader_id,category,message,contact_email,phone,status,created_at,updated_at FROM support_requests ORDER BY created_at DESC LIMIT 100").all(),
        env.DB.prepare("SELECT s.id,'account' source,s.reader_id,s.subject category,s.message,a.email contact_email,NULL phone,s.status,s.created_at,s.updated_at FROM support_tickets s LEFT JOIN auth_accounts a ON a.reader_id=s.reader_id ORDER BY s.created_at DESC LIMIT 100").all()
      ]);
      const items=[...(g.results||[]),...(a.results||[])].sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at))).slice(0,150); return J({items});
    }
    m=url.pathname.match(/^\/api\/admin\/support\/(guest|account)\/([^/]+)$/);
    if(m && M==='PUT') {
      const source=m[1],id=decodeURIComponent(m[2]),x=await body(request),status=x.status==='closed'?'closed':'open',table=source==='guest'?'support_requests':'support_tickets';
      const before=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first(); if(!before)return J({error:'support_not_found'},404);
      await env.DB.prepare(`UPDATE ${table} SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,id).run(); await audit(env,user.reader_id,'support_status','support',id,before,{...before,status}); return J({ok:true,status});
    }

    if(M==='GET' && url.pathname==='/api/admin/users') {
      const q=await env.DB.prepare('SELECT a.reader_id,a.email,r.display_name,ur.role,a.created_at FROM auth_accounts a JOIN reader_profiles r ON r.id=a.reader_id LEFT JOIN user_roles ur ON ur.reader_id=a.reader_id ORDER BY a.created_at DESC').all(); return J({items:q.results||[]});
    }
    m=url.pathname.match(/^\/api\/admin\/users\/([a-f0-9]{32})\/role$/);
    if(m && M==='PUT') {
      if(role!=='owner')return J({error:'owner_required'},403); const target=m[1],x=await body(request),newRole=x.role;
      if(!await env.DB.prepare('SELECT 1 ok FROM auth_accounts WHERE reader_id=?').bind(target).first())return J({error:'user_not_found'},404);
      const before=await env.DB.prepare('SELECT role FROM user_roles WHERE reader_id=?').bind(target).first();
      if(newRole==null||newRole===''){ if(target===user.reader_id)return J({error:'cannot_remove_self_owner'},400); await env.DB.prepare('DELETE FROM user_roles WHERE reader_id=?').bind(target).run(); }
      else if(['owner','admin'].includes(newRole)){ await env.DB.prepare('INSERT INTO user_roles(reader_id,role,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(reader_id) DO UPDATE SET role=excluded.role,updated_at=CURRENT_TIMESTAMP').bind(target,newRole).run(); }
      else return J({error:'invalid_role'},400);
      await audit(env,user.reader_id,'role_update','reader',target,before,{role:newRole||null}); return J({ok:true,role:newRole||null});
    }

    if(M==='GET' && url.pathname==='/api/admin/audit') {
      const q=await env.DB.prepare('SELECT l.id,l.actor_reader_id,a.email actor_email,l.action,l.entity_type,l.entity_id,l.created_at FROM audit_log l LEFT JOIN auth_accounts a ON a.reader_id=l.actor_reader_id ORDER BY l.id DESC LIMIT 200').all(); return J({items:q.results||[]});
    }

    return J({error:'admin_route_not_found'},404);
  }
};
