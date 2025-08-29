const SUPABASE_URL='https://yvakismtvwvjxylkorye.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';
const client=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const form=document.getElementById('createGuestForm');
const nameInput=document.getElementById('guestNameInput');
const createMsg=document.getElementById('createGuestMessage');
const listMsg=document.getElementById('listMessage');
const tbody=document.getElementById('guestTableBody');
const rowTpl=document.getElementById('guestRowTemplate');
const refreshBtn=document.getElementById('refreshListBtn');
const exportBtn=document.getElementById('exportCsvBtn');

let creating=false,lastSig='';
const POLLING_INTERVAL_MS=15000;
if(POLLING_INTERVAL_MS>0) setInterval(()=>{ if(!document.hidden) loadGuests(); },POLLING_INTERVAL_MS);

form.addEventListener('submit',onCreate);
refreshBtn.addEventListener('click',loadGuests);
exportBtn.addEventListener('click',exportCsv);
tbody.addEventListener('click',onTableClick);

function safe(t){return (t||'').replace(/[<>&"]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]));}
function buildLink(slug){const {origin,pathname}=location;return origin+pathname.replace(/[^/]+$/,'')+'index.html?guest='+encodeURIComponent(slug);}
function msgCreate(m,c){createMsg.textContent=m;createMsg.className='response-message '+c;}
function msgList(m,c){listMsg.textContent=m;listMsg.className='response-message '+c;}

async function onCreate(e){
 e.preventDefault(); if(creating)return;
 let nombre=nameInput.value.trim().replace(/\s+/g,' '); if(!nombre){msgCreate('Nombre requerido','error');return;}
 if(nombre.length>120) nombre=nombre.slice(0,120);
 creating=true; form.querySelector('button').disabled=true; msgCreate('Creando...','info');
 try{
   const {data,error}=await client.from('invitados').insert({nombre}).select('id,slug').single();
   if(error) throw error;
   msgCreate('Creado: '+data.slug,'success'); nameInput.value=''; loadGuests();
 }catch(err){
   console.error('CREATE',err);
   if(err.code==='42P01') msgCreate('Falta tabla','error');
   else if(err.message?.includes('Invalid API key')) msgCreate('API key inválida','error');
   else if(err.message?.includes('permission')) msgCreate('RLS sin policy INSERT','error');
   else msgCreate('Error creando','error');
 }finally{
   creating=false; form.querySelector('button').disabled=false;
 }
}

async function loadGuests(){
 msgList('Cargando...','info');
 const {data,error}=await client.from('invitados').select('id,nombre,slug,asistencia,hospedaje').order('nombre');
 if(error){
   console.error('LOAD',error);
   if(error.code==='42P01') msgList('Falta tabla','error');
   else if(error.message?.includes('Invalid API key')) msgList('API key inválida','error');
   else if(error.message?.includes('permission')) msgList('RLS sin policy SELECT','error');
   else msgList('Error','error');
   return;
 }
 const sig=data.length+':'+data.map(g=>g.id+(g.asistencia??'_')+(g.hospedaje??'_')).join('|');
 if(sig!==lastSig){ render(data); lastSig=sig; }
 msgList('Total: '+data.length,'success');
}

function render(list){
 tbody.innerHTML='';
 if(!list.length){tbody.innerHTML='<tr><td colspan="5">Sin invitados.</td></tr>';return;}
 for(const g of list){
   const tr=rowTpl.content.firstElementChild.cloneNode(true);
   tr.dataset.id=g.id; tr.dataset.slug=g.slug;
   tr.querySelector('[data-field=nombre]').textContent=safe(g.nombre);
   tr.querySelector('[data-field=asistencia]').innerHTML=stateTag(g.asistencia)+
     '<br><button data-action="toggle-asistencia" class="mini-btn">'+(g.asistencia===true?'Marcar No':'Marcar Sí')+'</button>';
   tr.querySelector('[data-field=hospedaje]').innerHTML=stateTag(g.hospedaje)+
     '<br><button data-action="toggle-hospedaje" class="mini-btn" '+(g.asistencia===true?'':'disabled style="opacity:.4;cursor:not-allowed;"')+'>'+(g.hospedaje===true?'Quitar':'Poner')+'</button>';
   tr.querySelector('[data-field=link]').setAttribute('title',buildLink(g.slug));
   tbody.appendChild(tr);
 }
}

function stateTag(v){if(v===true)return'<span class="state yes">Sí</span>'; if(v===false)return'<span class="state no">No</span>'; return'<span class="state null">-</span>';}

async function onTableClick(e){
 const b=e.target.closest('button'); if(!b)return;
 const tr=b.closest('tr'); if(!tr)return;
 const id=tr.dataset.id; const slug=tr.dataset.slug;
 switch(b.dataset.action){
   case 'copy': return copyLink(slug,tr);
   case 'delete': if(confirm('¿Borrar invitado?')){await client.from('invitados').delete().eq('id',id); loadGuests();} break;
   case 'reset': await client.from('invitados').update({asistencia:null,hospedaje:null}).eq('id',id); loadGuests(); break;
   case 'toggle-asistencia': await toggleAsistencia(id); break;
   case 'toggle-hospedaje': await toggleHospedaje(id); break;
 }
}

async function toggleAsistencia(id){
 const {data,error}=await client.from('invitados').select('asistencia').eq('id',id).single();
 if(error)return;
 const nuevo=data.asistencia===true?false:true;
 await client.from('invitados').update({asistencia:nuevo,...(nuevo?{}:{hospedaje:null})}).eq('id',id);
 loadGuests();
}
async function toggleHospedaje(id){
 const {data,error}=await client.from('invitados').select('hospedaje,asistencia').eq('id',id).single();
 if(error||data.asistencia!==true)return;
 await client.from('invitados').update({hospedaje:!data.hospedaje}).eq('id',id);
 loadGuests();
}

async function copyLink(slug,tr){
 try{await navigator.clipboard.writeText(buildLink(slug)); flash(tr,'link');}
 catch{alert('No se pudo copiar');}
}

function exportCsv(){
 const rows=[['Nombre','Slug','Link','Asistencia','Hospedaje']];
 [...tbody.querySelectorAll('tr')].forEach(tr=>{
   if(!tr.dataset.slug)return;
   rows.push([
     tr.querySelector('[data-field=nombre]').textContent,
     tr.dataset.slug,
     buildLink(tr.dataset.slug),
     tr.querySelector('[data-field=asistencia] .state').textContent,
     tr.querySelector('[data-field=hospedaje] .state').textContent
   ]);
 });
 const csv=rows.map(r=>r.map(f=>`"${String(f).replace(/"/g,'""')}"`).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='invitados.csv'; a.click();
 URL.revokeObjectURL(a.href);
}

function flash(tr,field){
 const el=tr.querySelector(`[data-field="${field}"]`); if(!el)return;
 el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'),700);
}

loadGuests();