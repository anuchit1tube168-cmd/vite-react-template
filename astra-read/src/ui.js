export const HTML = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#EFE7DA"><title>ASTRA Read</title><meta name="description" content="ASTRA Read — premium serialized fiction reader"><link rel="stylesheet" href="/app.css"></head><body><div id="app"><header class="header"><div class="wrap bar"><div class="brand"><span>ASTRA</span> Read</div><div class="search"><input aria-label="ค้นหา" placeholder="Search novels, authors, genres..."></div></div></header><main class="wrap contentMain"><section class="toolbar"><div class="genreScroll"><button class="pill on">All</button><button class="pill">Fantasy</button><button class="pill">Action</button><button class="pill">Mystery</button></div></section><section class="grid"><article class="card"><div class="cover" style="--accent:#684f87"><div class="coverArt"></div><div class="mark">AR</div><div class="coverText"><small>Fantasy</small><h3>นครเหนือเมฆ</h3><span>ASTRA Original</span></div></div><div class="meta"><span>★ 4.9</span><span>42 Chs</span></div><div class="title">นครเหนือเมฆ</div></article><article class="card"><div class="cover" style="--accent:#315b5a"><div class="coverArt"></div><div class="mark">AR</div><div class="coverText"><small>Mystery</small><h3>ตะเกียงสีดำ</h3><span>ASTRA Original</span></div></div><div class="meta"><span>★ 4.9</span><span>57 Chs</span></div><div class="title">ตะเกียงสีดำ</div></article></section></main></div><div id="toast" class="toast"></div><script type="module" src="/app.js"></script><script>
(function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  async function showSupport(){
    var modal=document.querySelector('#modal'), body=document.querySelector('#modalBody');
    if(!modal||!body)return;
    var email='';
    try{var me=await fetch('/api/auth/me',{credentials:'same-origin'});if(me.ok){var md=await me.json();email=md.user&&md.user.email||''}}catch(e){}
    body.innerHTML='<h2>ติดต่อผู้ดูแลระบบ</h2><p class="muted">แจ้งปัญหา สอบถาม หรือรายงานเนื้อหาได้โดยไม่ต้องเข้าสู่ระบบ</p><label class="fieldLabel">หัวข้อที่ต้องการติดต่อ *</label><select id="publicSupportCategory" class="field"><option value="coin_issue">เติม Coins แล้วไม่เข้า</option><option value="rights_report">รายงานสิทธิ์หรือแหล่งที่มาของเนื้อหา</option><option value="content_issue">แจ้งเนื้อหาผิดปกติ</option><option value="typo_report">แจ้งคำผิด</option><option value="other">อื่น ๆ</option></select><label class="fieldLabel">รายละเอียดปัญหา *</label><textarea id="publicSupportMessage" class="field textarea" placeholder="ระบุชื่อเรื่อง ตอนที่พบปัญหา หรือรายละเอียดที่ช่วยให้ตรวจสอบได้"></textarea><label class="fieldLabel">E-mail สำหรับติดต่อกลับ *</label><input id="publicSupportEmail" class="field" type="email" placeholder="name@example.com" value="'+esc(email)+'"><label class="fieldLabel">เบอร์โทรติดต่อ <span class="muted">(ไม่บังคับ)</span></label><input id="publicSupportPhone" class="field" type="tel" placeholder="08X-XXX-XXXX"><div class="heroActions"><button class="btn" data-act="close">ยกเลิก</button><button class="btn primary" data-public-support-send>ส่งข้อความหาแอดมิน</button></div><div id="publicSupportResult"></div>';
    modal.classList.add('show');
  }
  document.addEventListener('click',async function(e){
    var support=e.target.closest('[data-act="support"]');
    if(support){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await showSupport();return}
    var send=e.target.closest('[data-public-support-send]');
    if(send){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      var category=document.querySelector('#publicSupportCategory')?.value||'other';
      var message=document.querySelector('#publicSupportMessage')?.value.trim()||'';
      var contact_email=document.querySelector('#publicSupportEmail')?.value.trim()||'';
      var phone=document.querySelector('#publicSupportPhone')?.value.trim()||'';
      send.disabled=true;send.textContent='กำลังส่ง...';
      try{
        var r=await fetch('/api/support/public',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({category:category,message:message,contact_email:contact_email,phone:phone})});
        var d=await r.json().catch(function(){return {}});
        if(!r.ok)throw new Error(d.error||'request_failed');
        document.querySelector('#publicSupportResult').innerHTML='<div class="demoNotice">รับเรื่องแล้ว เลขที่ <b>'+esc(d.id)+'</b> ผู้ดูแลจะใช้ข้อมูลติดต่อที่ให้ไว้เพื่อตอบกลับ</div>';
        send.textContent='ส่งสำเร็จ';
      }catch(err){
        var map={invalid_category:'กรุณาเลือกหัวข้อ',invalid_message:'กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร',invalid_email:'E-mail ไม่ถูกต้อง',rate_limited:'ส่งรายการบ่อยเกินไป กรุณาลองภายหลัง'};
        document.querySelector('#publicSupportResult').innerHTML='<div class="demoNotice">'+esc(map[err.message]||'ส่งข้อความไม่สำเร็จ')+'</div>';
        send.disabled=false;send.textContent='ส่งข้อความหาแอดมิน';
      }
    }
  },true);
})();
</script></body></html>`;
