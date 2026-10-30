const RAW = 'https://raw.githubusercontent.com/anuchit1tube168-cmd/vite-react-template/astra-read-cleanroom/astra-read/src/';
const BOOKS = [
  {id:'skyforge',title:'นครเหนือเมฆ',author:'ลมเหนือ',genre:'Fantasy',status:'Ongoing',rating:4.9,chapters:42,accent:'#5B5BD6'},
  {id:'jadepath',title:'วิถีหยกนิรันดร์',author:'หมึกคราม',genre:'Cultivation',status:'Ongoing',rating:4.8,chapters:118,accent:'#0F766E'},
  {id:'zero-hour',title:'ศูนย์ชั่วโมง',author:'N. Vector',genre:'Sci-Fi',status:'Completed',rating:4.7,chapters:64,accent:'#334155'},
  {id:'glass-rain',title:'ฝนบนกระจก',author:'พรายดาว',genre:'Romance',status:'Completed',rating:4.6,chapters:36,accent:'#BE185D'},
  {id:'black-lantern',title:'ตะเกียงสีดำ',author:'Kirin',genre:'Mystery',status:'Ongoing',rating:4.9,chapters:57,accent:'#7C3AED'},
  {id:'iron-pulse',title:'ชีพจรเหล็ก',author:'Astra Forge',genre:'Action',status:'Ongoing',rating:4.5,chapters:81,accent:'#B45309'}
];
const GENRES = ['All','Cultivation','Action','Fantasy','Mystery','Romance','Sci-Fi'];
const SEC = {'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','permissions-policy':'camera=(), microphone=(), geolocation=()','x-frame-options':'SAMEORIGIN'};

addEventListener('fetch', event => event.respondWith(handle(event.request)));

async function source(name){
  const r = await fetch(RAW + name, {cf:{cacheTtl:300,cacheEverything:true}});
  if (!r.ok) throw new Error('GitHub source unavailable: '+name);
  return r.text();
}
function unwrap(s, prefix){
  s = s.trim();
  if (s.startsWith(prefix)) s = s.slice(prefix.length);
  return s.replace(/`;\s*$/,'');
}
function reply(body,type,status=200){return new Response(body,{status,headers:{'content-type':type,'cache-control':'public, max-age=60',...SEC}})}

async function handle(request){
  const u = new URL(request.url);
  try {
    if (u.pathname === '/api/health') return Response.json({ok:true,service:'astra-read',version:'0.1.0',mode:'github-backed-clean-room'});
    if (u.pathname === '/api/catalog') return Response.json({items:BOOKS,genres:GENRES});
    if (u.pathname === '/app.css') return reply(unwrap(await source('styles.js'),'export const CSS = `'),'text/css; charset=utf-8');
    if (u.pathname === '/app.js') {
      let js = unwrap(await source('client.js'),'export const CLIENT = String.raw`');
      js = js.replace('__BOOKS__',JSON.stringify(BOOKS)).replace('__GENRES__',JSON.stringify(GENRES));
      return reply(js,'text/javascript; charset=utf-8');
    }
    if (u.pathname.startsWith('/api/')) return Response.json({error:'not_found'},{status:404});
    return reply(unwrap(await source('ui.js'),'export const HTML = `'),'text/html; charset=utf-8');
  } catch (err) {
    return Response.json({ok:false,error:'upstream_source_unavailable',detail:String(err.message||err)},{status:502});
  }
}
