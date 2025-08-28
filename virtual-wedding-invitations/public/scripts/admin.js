const API_URL = '/api/invitados';

document.addEventListener('DOMContentLoaded', function() {
    // Generar link único y mostrarlo para compartir
    const form = document.getElementById('generate-link-form');
    const guestNameInput = document.getElementById('guestName');
    const generatedLinkDiv = document.getElementById('generatedLink');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const tbody = document.getElementById('adminTableBody');

    // Renderizar la tabla de invitados
    async function cargarInvitados() {
        tbody.innerHTML = '';
        const res = await fetch(API_URL);
        const invitados = await res.json();
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
            tr.querySelector('.delete').addEventListener('click', function() {
                if (confirm(`¿Seguro que deseas borrar a ${inv.nombre}?`)) {
                    fetch(API_URL, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: inv.nombre })
                    }).then(() => cargarInvitados());
                }
            });
            tbody.appendChild(tr);
        });
    }

    // Generar link único
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = guestNameInput.value.trim();
        if (!name) return;
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

    // Borrar todos (si tienes este botón)
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async function() {
            if (confirm("¿Seguro que quieres borrar TODAS las invitaciones y confirmaciones?")) {
                await fetch(API_URL, { method: 'DELETE' });
                generatedLinkDiv.innerHTML = "";
                await cargarInvitados();
            }
        });
    }

    // Cargar invitados al iniciar
    cargarInvitados();
});