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
let creating=false;

form.addEventListener('submit',onCreateGuest);
refreshBtn.addEventListener('click',loadGuests);
exportBtn.addEventListener('click',exportCsv);
tbody.addEventListener('click',onTableClick);

async function onCreateGuest(e){
 e.preventDefault();
 if(creating)return;
 let raw=nameInput.value.trim().replace(/\s+/g,' ');
 if(!raw){setCreateMsg('Nombre requerido','error');return;}
 if(raw.length>80) raw=raw.slice(0,80);
 creating=true; setCreateMsg('Creando...','info'); form.querySelector('button').disabled=true;
 try{
   const slug=await uniqueSlug(raw);
   const {error}=await client.from('invitados').insert({nombre:raw,slug});
   if(error) throw error;
   setCreateMsg('Invitado creado.','success');
   nameInput.value='';
   await loadGuests();
 }catch(err){console.error(err);setCreateMsg('Error creando invitado.','error');}
 finally{creating=false; form.querySelector('button').disabled=false;}
}

function slugify(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
async function uniqueSlug(nombre){
 const base=slugify(nombre); let c=base; let i=2;
 while(true){
  const {data,error}=await client.from('invitados').select('id').eq('slug',c).limit(1);
  if(error) throw error;
  if(!data||!data.length) return c;
  c=`${base}-${i++}`;
 }
}

function buildLink(slug){
 const {origin,pathname}=location;
 return origin+pathname.replace(/[^/]+$/,'')+'index.html?guest='+encodeURIComponent(slug);
}

async function loadGuests(){
 setListMsg('Cargando...','info');
 const {data,error}=await client.from('invitados').select('id,nombre,slug,asistencia,hospedaje').order('nombre');
 if(error){console.error(error);setListMsg('Error cargando.','error');return;}
 render(data); setListMsg(`Total: ${data.length}`,'success');
}

function render(list){
 tbody.innerHTML='';
 if(!list.length){tbody.innerHTML='<tr><td colspan="5">Sin invitados.</td></tr>';return;}
 for(const g of list){
  const tr=rowTpl.content.firstElementChild.cloneNode(true);
  tr.dataset.id=g.id; tr.dataset.slug=g.slug;
  tr.querySelector('[data-field=nombre]').textContent=g.nombre;
  tr.querySelector('[data-field=asistencia]').innerHTML=stateTag(g.asistencia)+
    '<br><button data-action="toggle-asistencia" class="mini-btn">'+(g.asistencia===true?'Marcar No':'Marcar Sí')+'</button>';
  tr.querySelector('[data-field=hospedaje]').innerHTML=stateTag(g.hospedaje)+
    '<br><button data-action="toggle-hospedaje" class="mini-btn" '+(g.asistencia===true?'':'disabled style="opacity:.4;cursor:not-allowed;"')+'>'+(g.hospedaje===true?'Quitar':'Poner')+'</button>';
  tbody.appendChild(tr);
 }
}

function stateTag(v){ if(v===true)return'<span class="state yes">Sí</span>'; if(v===false)return'<span class="state no">No</span>'; return'<span class="state null">-</span>'; }

async function onTableClick(e){
 const btn=e.target.closest('button'); if(!btn)return;
 const tr=btn.closest('tr'); const id=tr.dataset.id; const slug=tr.dataset.slug;
 switch(btn.dataset.action){
  case 'copy': await copyLink(slug,tr); break;
  case 'delete': if(confirm('¿Borrar invitado?')){await client.from('invitados').delete().eq('id',id); await loadGuests();} break;
  case 'reset': await client.from('invitados').update({asistencia:null,hospedaje:null}).eq('id',id); await loadGuests(); break;
  case 'toggle-asistencia': await toggleAsistencia(id); break;
  case 'toggle-hospedaje': await toggleHospedaje(id); break;
 }
}

async function toggleAsistencia(id){
 const {data,error}=await client.from('invitados').select('asistencia').eq('id',id).maybeSingle();
 if(error)return;
 const newVal=data.asistencia===true?false:true;
 await client.from('invitados').update({asistencia:newVal,...(newVal?{}:{hospedaje:null})}).eq('id',id);
 loadGuests();
}
async function toggleHospedaje(id){
 const {data,error}=await client.from('invitados').select('hospedaje,asistencia').eq('id',id).maybeSingle();
 if(error||data.asistencia!==true)return;
 await client.from('invitados').update({hospedaje:!data.hospedaje}).eq('id',id);
 loadGuests();
}

async function copyLink(slug,tr){
 try{await navigator.clipboard.writeText(buildLink(slug)); flash(tr,'link');}catch{alert('No se pudo copiar');}
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
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a');
 a.href=URL.createObjectURL(blob); a.download='invitados.csv'; a.click(); URL.revokeObjectURL(a.href);
}

function flash(tr,field){const el=tr.querySelector(`[data-field="${field}"]`); if(!el)return; el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'),700);}
function setCreateMsg(m,t){createMsg.textContent=m; createMsg.className='response-message '+t;}
function setListMsg(m,t){listMsg.textContent=m; listMsg.className='response-message '+t;}

client.channel('invitados-changes').on('postgres_changes',{event:'*',schema:'public',table:'invitados'},loadGuests).subscribe();
loadGuests();