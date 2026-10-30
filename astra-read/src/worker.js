import { BOOKS, GENRES } from './data.js';
import { HTML } from './ui.js';
import { CSS } from './styles.js';
import { CLIENT } from './client.js';

const securityHeaders = {
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=()',
  'x-frame-options':'SAMEORIGIN'
};

const text = (body,type,status=200) => new Response(body,{status,headers:{'content-type':type,'cache-control':'no-store',...securityHeaders}});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      return Response.json({ok:true,service:'astra-read',version:'0.1.0',mode:'clean-room'});
    }
    if (url.pathname === '/api/catalog') {
      return Response.json({items:BOOKS,genres:GENRES});
    }
    if (url.pathname === '/app.css') return text(CSS,'text/css; charset=utf-8');
    if (url.pathname === '/app.js') {
      const js = CLIENT.replace('__BOOKS__',JSON.stringify(BOOKS)).replace('__GENRES__',JSON.stringify(GENRES));
      return text(js,'text/javascript; charset=utf-8');
    }
    if (url.pathname.startsWith('/api/')) return Response.json({error:'not_found'},{status:404});
    return text(HTML,'text/html; charset=utf-8');
  }
};
