'use strict';
document.documentElement.classList.add('js');
const $=s=>document.querySelector(s);
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('#brief-form').addEventListener('submit',e=>{e.preventDefault();const text=$('#brief').value.trim();if(!text){$('#brief-status').textContent='Describe the project first.';$('#brief').focus();return}download('POMEGRANATE × LILY — PROJECT DRAFT\n\n'+text+'\n\nAudience:\n[Who uses it?]\n\nLimits:\n[Budget, timing and data sensitivity]\n\nQuality Check:\n[How will success be demonstrated?]\n\nLocal draft only. Not submitted.','Pomegranate-Lily-project-brief.txt','text/plain;charset=utf-8');$('#brief-status').textContent='Draft prepared. Nothing submitted.'});
let start=null;$('#stage').addEventListener('pointerdown',e=>{if(e.isPrimary)start={x:e.clientX,y:e.clientY,id:e.pointerId}});window.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.3){const modes=[...document.querySelectorAll('[name="angle"]')],i=modes.findIndex(m=>m.checked);modes[(i+(dx<0?1:2))%3].checked=true}});window.addEventListener('pointercancel',()=>start=null);const contactRoute=$('#nav-contact');
function openContact(e){if(e)e.preventDefault();contactRoute.checked=true;$('#contact').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
$('#contact-cta').addEventListener('click',openContact);
$('#project-cta').addEventListener('click',openContact);
