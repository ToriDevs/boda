const SUPABASE_URL = 'https://yvakismtvwvjxylkorye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('generate-link-form');
    const guestNameInput = document.getElementById('guestName');
    const generatedLinkDiv = document.getElementById('generatedLink');
    const tbody = document.getElementById('adminTableBody');

    // Renderizar la tabla de invitados
    async function cargarInvitados() {
        tbody.innerHTML = '';
        const { data: invitados, error } = await supabase
            .from('invitados')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) {
            tbody.innerHTML = `<tr><td colspan="4" style="color:#f00;">Error cargando invitados</td></tr>`;
            return;
        }
        if (!invitados.length) {
            tbody.innerHTML = `<tr><td colspan="4" style="color:#aaa;">No hay invitaciones generadas.</td></tr>`;
            return;
        }
        invitados.forEach(inv => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${inv.nombre}</td>
                <td>${inv.asistencia === true ? 'Confirmado' : inv.asistencia === false ? 'No asistirá' : ''}</td>
                <td>${inv.hospedaje === true ? 'Sí' : inv.hospedaje === false ? 'No' : ''}</td>
                <td class="admin-actions">
                    <button class="admin-btn delete">Eliminar</button>
                </td>
            `;
            tr.querySelector('.delete').addEventListener('click', async function() {
                if (confirm(`¿Seguro que deseas borrar a ${inv.nombre}?`)) {
                    await supabase.from('invitados').delete().eq('id', inv.id);
                    cargarInvitados();
                }
            });
            tbody.appendChild(tr);
        });
    }

    // Generar link único
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = guestNameInput.value.trim();
        if (!name) return;
        // Inserta el invitado si no existe
        const { data: existing } = await supabase
            .from('invitados')
            .select('id')
            .eq('nombre', name)
            .maybeSingle();
        if (!existing) {
            await supabase.from('invitados').insert([{ nombre: name }]);
            cargarInvitados();
        }
        const code = encodeURIComponent(btoa(unescape(encodeURIComponent(name))));
        const url = `${window.location.origin}/index.html?guest=${code}`;
        generatedLinkDiv.innerHTML = `
            <div>
                <input type="text" value="${url}" readonly style="width:80%;padding:0.4em;border-radius:6px;border:1px solid var(--oro);text-align:center;">
                <button id="copyLinkBtn" type="button" class="admin-btn" style="margin-left:0.5em;">Copiar</button>
            </div>
        `;
        document.getElementById('copyLinkBtn').onclick = function() {
            navigator.clipboard.writeText(url);
        };
    });

    // Cargar invitados al iniciar
    cargarInvitados();
});