import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL='https://yvakismtvwvjxylkorye.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';
const sb = createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

// Elementos
const dearGuestEl=document.getElementById('dearGuest');
const rsvpSection=document.getElementById('rsvpSection');
const yesBtn=document.getElementById('confirmYesButton');
const noBtn=document.getElementById('confirmNoButton');
const hospedajeContainer=document.getElementById('hospedajeContainer');
const hospedajeBtn=document.getElementById('hospedajeButton');
const responseMessage=document.getElementById('responseMessage');

let guest=null,busy=false;

init().catch(e=>{console.error(e);setMsg('Error inicializando.','error');});

async function init(){
  const slug=new URLSearchParams(location.search).get('guest');
  if(!slug){dearGuestEl.textContent='Invitado no identificado.';return;}
  dearGuestEl.textContent='Cargando invitado...';
  const {data,error}=await sb.from('invitados').select('id,nombre,slug,asistencia,hospedaje').eq('slug',slug).maybeSingle();
  if(error){console.error(error);dearGuestEl.textContent='Error consultando invitado.';return;}
  if(!data){dearGuestEl.textContent='Invitado no encontrado.';return;}
  guest=data;
  dearGuestEl.textContent=`Querido/a ${guest.nombre}`;
  rsvpSection.hidden=false;
  yesBtn.onclick=()=>updateAsistencia(true);
  noBtn.onclick=()=>updateAsistencia(false);
  hospedajeBtn.onclick=toggleHospedaje;
  reflect();
}

function reflect(){
  if(!guest)return;
  yesBtn.classList.toggle('active',guest.asistencia===true);
  noBtn.classList.toggle('active',guest.asistencia===false);
  if(guest.asistencia===true){
    hospedajeContainer.style.display='block';
    hospedajeBtn.dataset.state=guest.hospedaje?'on':'off';
    hospedajeBtn.textContent=guest.hospedaje?'Cancelar hospedaje':'Solicitar hospedaje';
  }else{
    hospedajeContainer.style.display='none';
  }
}

async function updateAsistencia(val){
  if(!guest||busy)return;
  if(guest.asistencia===val){ if(val===true) hospedajeContainer.style.display='block'; return;}
  busy=true; lock(true); setMsg('Guardando...','info');
  const {data,error}=await sb.from('invitados').update({asistencia:val,...(val?{}:{hospedaje:null})}).eq('id',guest.id).select().maybeSingle();
  busy=false; lock(false);
  if(error){console.error(error);setMsg('Error guardando asistencia.','error');return;}
  guest=data; setMsg(val?'¡Confirmado! Gracias.':'Gracias, sentimos que no puedas venir.','success'); reflect();
}

async function toggleHospedaje(){
  if(!guest||busy||guest.asistencia!==true)return;
  busy=true; lock(true);
  const newVal=!guest.hospedaje; setMsg('Actualizando hospedaje...','info');
  const {data,error}=await sb.from('invitados').update({hospedaje:newVal}).eq('id',guest.id).select().maybeSingle();
  busy=false; lock(false);
  if(error){console.error(error);setMsg('Error actualizando hospedaje.','error');return;}
  guest=data; setMsg(newVal?'Hospedaje solicitado.':'Hospedaje cancelado.','success'); reflect();
}

function lock(s){[yesBtn,noBtn,hospedajeBtn].forEach(b=>b&&(b.disabled=s));}
function setMsg(m,t){responseMessage.textContent=m;responseMessage.className='response-message '+t;}