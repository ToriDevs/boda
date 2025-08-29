import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://yvakismtvwvjxylkorye.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('createGuestForm');
const nameInput = document.getElementById('guestNameInput');
const createMsg = document.getElementById('createGuestMessage');
const listMsg = document.getElementById('listMessage');
const tbody = document.getElementById('guestTableBody');
const rowTpl = document.getElementById('guestRowTemplate');
const refreshBtn = document.getElementById('refreshListBtn');
const exportBtn = document.getElementById('exportCsvBtn');

let creating = false;

form.addEventListener('submit', onCreateGuest);
refreshBtn.addEventListener('click', () => loadGuests());
exportBtn.addEventListener('click', exportCsv);

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const tr = btn.closest('tr');
  const id = tr?.dataset.id;
  if (!id) return;
  const slug = tr.dataset.slug;

  switch (btn.dataset.action) {
    case 'copy': await copyLink(slug, tr); break;
    case 'delete':
      if (confirm('¿Borrar invitado?')) {
        await supabaseClient.from('invitados').delete().eq('id', id);
        await loadGuests();
      }
      break;
    case 'reset':
      await supabaseClient.from('invitados')
        .update({ asistencia: null, hospedaje: null })
        .eq('id', id);
      await loadGuests();
      break;
    case 'toggle-asistencia': await toggleAsistencia(tr, id); break;
    case 'toggle-hospedaje': await toggleHospedaje(tr, id); break;
  }
});

async function onCreateGuest(e) {
  e.preventDefault();
  if (creating) return;
  let rawName = nameInput.value.trim().replace(/\s+/g, ' ');
  if (!rawName) return setCreateMsg('Nombre requerido', 'error');
  if (rawName.length > 80) rawName = rawName.slice(0, 80);

  creating = true;
  form.querySelector('button[type="submit"]').disabled = true;
  setCreateMsg('Creando...', 'info');

  try {
    const slug = await generateUniqueSlug(rawName);
    const { error } = await supabaseClient
      .from('invitados')
      .insert({ nombre: rawName, slug });
    if (error) throw error;
    setCreateMsg('Invitado creado.', 'success');
    nameInput.value = '';
    await loadGuests();
  } catch (err) {
    console.error(err);
    setCreateMsg('Error creando invitado.', 'error');
  } finally {
    creating = false;
    form.querySelector('button[type="submit"]').disabled = false;
  }
}

async function generateUniqueSlug(nombre) {
  const base = slugify(nombre);
  let candidate = base;
  let i = 2;
  while (true) {
    const { data, error } = await supabaseClient
      .from('invitados')
      .select('id')
      .eq('slug', candidate)
      .limit(1);
    if (error) throw error;
    if (!data || !data.length) return candidate;
    candidate = `${base}-${i++}`;
  }
}

function slugify(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBasePath() {
  const { origin, pathname } = window.location;
  return origin + pathname.replace(/[^/]+$/, '');
}

function buildGuestLink(slug) {
  return `${getBasePath()}index.html?guest=${encodeURIComponent(slug)}`;
}

async function copyLink(slug, tr) {
  const link = buildGuestLink(slug);
  try {
    await navigator.clipboard.writeText(link);
    flashCell(tr, 'link');
  } catch {
    alert('No se pudo copiar.');
  }
}

async function loadGuests() {
  setListMsg('Cargando...', 'info');
  const { data, error } = await supabaseClient
    .from('invitados')
    .select('id,nombre,slug,asistencia,hospedaje')
    .order('nombre', { ascending: true });
  if (error) {
    console.error(error);
    return setListMsg('Error cargando.', 'error');
  }
  renderGuestTable(data);
  setListMsg(`Total: ${data.length}`, 'success');
}

function renderGuestTable(list) {
  tbody.innerHTML = '';
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5">Sin invitados.</td></tr>';
    return;
  }
  for (const g of list) {
    const node = rowTpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = g.id;
    node.dataset.slug = g.slug;
    node.querySelector('[data-field="nombre"]').textContent = g.nombre;

    const asistenciaCell = node.querySelector('[data-field="asistencia"]');
    asistenciaCell.innerHTML = formatState(g.asistencia) +
      '<br><button data-action="toggle-asistencia" class="mini-btn">' +
      (g.asistencia === true ? 'Marcar No' : 'Marcar Sí') +
      '</button>';

    const hospedajeCell = node.querySelector('[data-field="hospedaje"]');
    hospedajeCell.innerHTML = formatState(g.hospedaje) +
      '<br><button data-action="toggle-hospedaje" class="mini-btn" ' +
      (g.asistencia === true ? '' : 'disabled style="opacity:.4;cursor:not-allowed;"') +
      '>' + (g.hospedaje === true ? 'Quitar' : 'Poner') + '</button>';

    tbody.appendChild(node);
  }
}

function formatState(v) {
  if (v === true) return '<span class="state yes">Sí</span>';
  if (v === false) return '<span class="state no">No</span>';
  return '<span class="state null">-</span>';
}

async function toggleAsistencia(tr, id) {
  const cell = tr.querySelector('[data-field="asistencia"]');
  cell.classList.add('flash');
  const current = cell.querySelector('.state')?.textContent === 'Sí';
  const { error } = await supabaseClient
    .from('invitados')
    .update({ asistencia: !current, ...(!current ? {} : { }) , ...(current ? { hospedaje: null } : {}) })
    .eq('id', id);
  if (error) console.error(error);
  await loadGuests();
}

async function toggleHospedaje(tr, id) {
  const cell = tr.querySelector('[data-field="hospedaje"]');
  cell.classList.add('flash');
  const current = cell.querySelector('.state')?.textContent === 'Sí';
  const { error } = await supabaseClient
    .from('invitados')
    .update({ hospedaje: !current })
    .eq('id', id);
  if (error) console.error(error);
  await loadGuests();
}

function exportCsv() {
  const rows = [['Nombre', 'Slug', 'Link', 'Asistencia', 'Hospedaje']];
  [...tbody.querySelectorAll('tr')].forEach(tr => {
    if (!tr.dataset.slug) return;
    rows.push([
      tr.querySelector('[data-field="nombre"]')?.textContent || '',
      tr.dataset.slug,
      buildGuestLink(tr.dataset.slug),
      tr.querySelector('[data-field="asistencia"] .state')?.textContent || '',
      tr.querySelector('[data-field="hospedaje"] .state')?.textContent || ''
    ]);
  });
  const csv = rows.map(r => r.map(f => `"${String(f).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'invitados.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function flashCell(tr, field) {
  const el = tr.querySelector(`[data-field="${field}"]`);
  if (!el) return;
  el.classList.add('flash');
  setTimeout(()=>el.classList.remove('flash'),700);
}

function setCreateMsg(msg,type){ createMsg.textContent=msg; createMsg.className='response-message '+type; }
function setListMsg(msg,type){ listMsg.textContent=msg; listMsg.className='response-message '+type; }

// Realtime
supabaseClient
  .channel('invitados-changes')
  .on('postgres_changes', { event:'*', schema:'public', table:'invitados' }, () => loadGuests())
  .subscribe();

loadGuests();