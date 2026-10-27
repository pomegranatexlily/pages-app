'use strict';
document.documentElement.classList.add('js');
document.querySelectorAll('.no-js-info').forEach(node=>{node.hidden=true;});
const $=s=>document.querySelector(s);
function providerDetail(result,httpStatus){const raw=typeof result?.message==='string'?result.message:typeof result?.error==='string'?result.error:'';const safe=raw.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,'[redacted key]').trim().slice(0,240);return 'EasyFormAPI HTTP '+httpStatus+(safe?': '+safe:': no error detail returned.');}
const form=$('#brief-form'),brief=$('#brief'),status=$('#brief-status'),send=form.querySelector('button[type="submit"]');
let sending=false;
form.addEventListener('submit',async e=>{
  if(typeof fetch!=='function'||typeof AbortController!=='function')return;
  e.preventDefault();
  if(sending)return;
  const message=brief.value.trim();
  if(!message||message.length>5000){status.textContent='Describe your project in 1–5,000 characters.';brief.focus();return;}
  if(form.querySelector('[name="botcheck"]').checked){status.textContent='The inquiry was not submitted.';return;}
  const body=new FormData(form);body.set('message',message);
  const controller=new AbortController(),label=send.textContent;
  sending=true;send.disabled=true;send.textContent='Sending…';form.setAttribute('aria-busy','true');status.textContent='Sending your inquiry…';
  const timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(form.action,{method:'POST',body,headers:{Accept:'application/json'},credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
    let result=null;try{result=await response.json()}catch{}
    if(!response.ok||result?.success===false){status.textContent=providerDetail(result,response.status)+' The form service did not confirm acceptance. '+(response.status===429?'Wait before retrying. ':'')+'Your message is still here; check before resending.';return;}
    if(result?.success!==true){status.textContent=providerDetail(result,response.status)+' We could not confirm acceptance. Your message may have reached the service; check before resending.';return;}
    status.textContent='Thank you—your inquiry was accepted for delivery. Inbox arrival is not independently confirmed.';
    if(brief.value.trim()===message)brief.value='';
  }catch{
    status.textContent='We could not confirm submission. Your message is still here; it may have reached the service. Check before resending to avoid duplicates.';
  }finally{clearTimeout(timer);sending=false;send.disabled=false;send.textContent=label;form.removeAttribute('aria-busy');}
});
let start=null;$('#stage').addEventListener('pointerdown',e=>{if(e.isPrimary)start={x:e.clientX,y:e.clientY,id:e.pointerId}});window.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.3){const modes=[...document.querySelectorAll('[name="angle"]')],i=modes.findIndex(m=>m.checked);modes[(i+(dx<0?1:2))%3].checked=true}});window.addEventListener('pointercancel',()=>start=null);
function openContact(e){if(e)e.preventDefault();$('#nav-contact').checked=true;$('#contact').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});brief.focus({preventScroll:true});}
$('#contact-cta').addEventListener('click',openContact);
$('#project-cta').addEventListener('click',openContact);
