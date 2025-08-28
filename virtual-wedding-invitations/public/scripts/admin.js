const API_URL = '/api/invitados';

document.addEventListener('DOMContentLoaded', function() {
    // Generar link único y mostrarlo para compartir
    const form = document.getElementById('generate-link-form');
    const guestNameInput = document.getElementById('guestName');
    const generatedLinkDiv = document.getElementById('generatedLink');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const confirmedList = document.getElementById('confirmedList');

    async function renderTable() {
        confirmedList.innerHTML = '';
        const res = await fetch(API_URL);
        const invitados = await res.json();
        if (!invitados.length) {
            confirmedList.innerHTML = `<tr><td colspan="5" style="color:#aaa;">No hay invitaciones generadas.</td></tr>`;
            return;
        }
        invitados.forEach(data => {
            const url = `${window.location.origin}/index.html?guest=${encodeURIComponent(data.nombre)}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.nombre}</td>
                <td><a href="${url}" target="_blank">Ver invitación</a></td>
                <td>${data.asistencia === true ? 'Sí' : (data.asistencia === false ? 'No' : '')}</td>
                <td>${data.hospedaje === true ? 'Sí' : (data.hospedaje === false ? 'No' : '')}</td>
                <td><button class="delete-btn" title="Borrar invitación" data-name="${data.nombre}">✖</button></td>
            `;
            confirmedList.appendChild(tr);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const name = this.getAttribute('data-name');
                if (confirm(`¿Borrar invitación de "${name}"?`)) {
                    await fetch(`${API_URL}?nombre=${encodeURIComponent(name)}`, { method: 'DELETE' });
                    await renderTable();
                }
            });
        });
    }

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
        // Copiar al portapapeles
        document.getElementById('copyLinkBtn').onclick = function() {
            navigator.clipboard.writeText(url);
        };
    });

    clearAllBtn.addEventListener('click', async function() {
        if (confirm("¿Seguro que quieres borrar TODAS las invitaciones y confirmaciones?")) {
            await fetch(API_URL, { method: 'DELETE' });
            generatedLinkDiv.innerHTML = "";
            await renderTable();
        }
    });

    // Función para cargar y renderizar la tabla de invitados
    function cargarInvitados() {
        fetch('/api/invitados')
            .then(res => res.json())
            .then(data => {
                const tbody = document.getElementById('adminTableBody');
                tbody.innerHTML = '';
                data.forEach(inv => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${inv.nombre}</td>
                        <td>${inv.asistencia === true ? 'Confirmado' : inv.asistencia === false ? 'No asistirá' : ''}</td>
                        <td>${inv.hospedaje === true ? 'Sí' : inv.hospedaje === false ? 'No' : ''}</td>
                        <td class="admin-actions">
                            <button class="admin-btn delete">Eliminar</button>
                        </td>
                    `;
                    // Botón eliminar funcional
                    tr.querySelector('.delete').addEventListener('click', function() {
                        if (confirm(`¿Seguro que deseas borrar a ${inv.nombre}?`)) {
                            fetch('/api/invitados', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ nombre: inv.nombre })
                            }).then(() => cargarInvitados());
                        }
                    });
                    tbody.appendChild(tr);
                });
            });
    }

    // Llama a la función al cargar la página
    cargarInvitados();
});