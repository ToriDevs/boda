const SUPABASE_URL='https://yvakismtvwvjxylkorye.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';
const sb = supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const dearGuestEl=document.getElementById('dearGuest');
const rsvpSection=document.getElementById('rsvpSection');
const yesBtn=document.getElementById('confirmYesButton');
const noBtn=document.getElementById('confirmNoButton');
const hospedajeContainer=document.getElementById('hospedajeContainer');
const hospedajeBtn=document.getElementById('hospedajeButton');
const responseMessage=document.getElementById('responseMessage');
let guest=null,busy=false;

init().catch(()=>setMsg('Error inicializando.','error'));

function safeText(t){return (t||'').replace(/[<>&"]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));}

async function init(){
  const slug=new URLSearchParams(location.search).get('guest');
  if(!slug){dearGuestEl.textContent='Falta ?guest=slug';return;}
  dearGuestEl.textContent='Cargando...';
  const {data,error}=await sb.from('invitados').select('id,nombre,slug,asistencia,hospedaje').eq('slug',slug).maybeSingle();
  if(error){dearGuestEl.textContent='Error.';setMsg(error.message,'error');return;}
  if(!data){dearGuestEl.textContent='Invitado no encontrado.';return;}
  guest=data;
  dearGuestEl.textContent=`Querido/a ${safeText(guest.nombre)}`;
  rsvpSection.hidden=false;
  yesBtn.onclick=()=>updateAsistencia(true);
  noBtn.onclick=()=>updateAsistencia(false);
  hospedajeBtn.onclick=toggleHospedaje;
  reflect();
}

function reflect(){
  yesBtn.classList.toggle('active',guest?.asistencia===true);
  noBtn.classList.toggle('active',guest?.asistencia===false);
  hospedajeContainer.style.display=guest?.asistencia===true?'block':'none';
  if(guest?.asistencia===true){
    hospedajeBtn.textContent=guest.hospedaje?'Cancelar hospedaje':'Solicitar hospedaje';
  }
}

async function updateAsistencia(val){
  if(!guest||busy)return;
  if(guest.asistencia===val){ if(val) hospedajeContainer.style.display='block'; return; }
  busy=true; lock(true); setMsg('Guardando...','info');
  const {data,error}=await sb.from('invitados').update({asistencia:val,...(val?{}:{hospedaje:null})}).eq('id',guest.id).select().maybeSingle();
  busy=false; lock(false);
  if(error){setMsg('Error guardando.','error');return;}
  guest=data; setMsg(val?'Confirmado.':'Actualizado.','success'); reflect();
}

async function toggleHospedaje(){
  if(!guest||busy||guest.asistencia!==true)return;
  busy=true; lock(true); setMsg('Actualizando...','info');
  const {data,error}=await sb.from('invitados').update({hospedaje:!guest.hospedaje}).eq('id',guest.id).select().maybeSingle();
  busy=false; lock(false);
  if(error){setMsg('Error hospedaje.','error');return;}
  guest=data; setMsg(guest.hospedaje?'Hospedaje solicitado.':'Hospedaje cancelado.','success'); reflect();
}

function lock(s){[yesBtn,noBtn,hospedajeBtn].forEach(b=>b&&(b.disabled=s));}
function setMsg(m,t){responseMessage.textContent=m;responseMessage.className='response-message '+t;}