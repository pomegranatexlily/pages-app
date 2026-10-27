'use strict';
document.documentElement.classList.add('js');
document.querySelectorAll('.no-js-info').forEach(node=>{node.hidden=true;});
const $=s=>document.querySelector(s);
function buildInquiryMailto(message){return 'mailto:editor.hw12@gmail.com?subject='+encodeURIComponent('Pomegranate × Lily project inquiry')+'&body='+encodeURIComponent(String(message).replace(/\r?\n/g,'\r\n'));}
const form=$('#brief-form'),brief=$('#brief'),status=$('#brief-status'),emailLink=$('#email-cta');
function prepareDraft(e){
  const message=brief.value.trim();
  if(!message||message.length>5000){if(e)e.preventDefault();status.textContent='Describe your project in 1–5,000 characters.';brief.focus();return false;}
  try{emailLink.href=buildInquiryMailto(message);status.textContent='Email draft requested for editor.hw12@gmail.com. Review it and press Send in your email app. This page has not sent an email. If no app opens, copy your message and use the address below.';return true;}
  catch{if(e)e.preventDefault();status.textContent='The draft could not be prepared. Your message is still here. Copy it and email editor.hw12@gmail.com directly.';return false;}
}
emailLink.addEventListener('click',prepareDraft);
form.addEventListener('submit',e=>{e.preventDefault();emailLink.click();});
brief.addEventListener('input',()=>{status.textContent='';try{emailLink.href=buildInquiryMailto(brief.value.trim())}catch{emailLink.href='mailto:editor.hw12@gmail.com'}});
let start=null;$('#stage').addEventListener('pointerdown',e=>{if(e.isPrimary)start={x:e.clientX,y:e.clientY,id:e.pointerId}});window.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.3){const modes=[...document.querySelectorAll('[name="angle"]')],i=modes.findIndex(m=>m.checked);modes[(i+(dx<0?1:2))%3].checked=true}});window.addEventListener('pointercancel',()=>start=null);
function openContact(e){if(e)e.preventDefault();$('#nav-contact').checked=true;$('#contact').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});brief.focus({preventScroll:true});}
$('#contact-cta').addEventListener('click',openContact);
$('#project-cta').addEventListener('click',openContact);
