const API_URL = '/api/invitados';

document.addEventListener('DOMContentLoaded', function() {
    const guestNameInput = document.getElementById('guestNameInput');
    const generateLinkBtn = document.getElementById('generateLinkBtn');
    const generatedLink = document.getElementById('generatedLink');
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

    async function handleGenerate() {
        let name = guestNameInput.value.trim();
        if (name) {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: name })
            });
            guestNameInput.value = "";
            await renderTable();
            const url = `${window.location.origin}/index.html?guest=${encodeURIComponent(name)}`;
            generatedLink.innerHTML = `
                <div style="margin-top:1em;">
                    <strong>Link para <b>${name}</b>:</strong><br>
                    <input type="text" value="${url}" readonly style="width:90%;padding:6px;border-radius:6px;border:1px solid #ccc;margin-top:6px;" onclick="this.select()" />
                    <br>
                    <a href="${url}" target="_blank" style="display:inline-block;margin-top:8px;color:#386641;">Abrir invitación</a>
                </div>
            `;
        } else {
            generatedLink.textContent = "Por favor, escribe el nombre del invitado.";
        }
    }

    generateLinkBtn.addEventListener('click', handleGenerate);

    guestNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleGenerate();
        }
    });

    clearAllBtn.addEventListener('click', async function() {
        if (confirm("¿Seguro que quieres borrar TODAS las invitaciones y confirmaciones?")) {
            await fetch(API_URL, { method: 'DELETE' });
            generatedLink.innerHTML = "";
            await renderTable();
        }
    });

    renderTable();
});